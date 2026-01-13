from rest_framework import viewsets, status, filters, permissions
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import models, transaction
from django.db.models.functions import ExtractYear
import django_filters
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    User, Group, GroupMembers, GroupSupervisors, GroupInvitation,
    Project, ApprovalRequest, Role, AcademicAffiliation,
    GroupCreationRequest, GroupMemberApproval, NotificationLog, College, UserRoles
)
from .serializers import (
    GroupSerializer, GroupDetailSerializer, GroupCreateSerializer,
    GroupMembersSerializer, GroupInvitationSerializer,
    CreateGroupInvitationSerializer, ProjectSerializer,
    ApprovalRequestSerializer, NotificationLogSerializer,
    RoleSerializer, UserSerializer
)
from .serializers import UserRolesSerializer
from .permissions import PermissionManager
from .utils import InvitationService, NotificationService
from core.notification_manager import NotificationManager


# ============================================================================================
# 1. GroupViewSet
# ============================================================================================

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return GroupCreateSerializer
        if self.action in ['retrieve', 'my_group']:
            return GroupDetailSerializer
        return GroupSerializer

    def create(self, request, *args, **kwargs):
        """Create a group via approval request"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        approval_request = serializer.save()
        return Response({
            "message": "تم إرسال طلب إنشاء المجموعة للموافقة بنجاح",
            "approval_request_id": approval_request.approval_id,
            "status": "pending"
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add members to a group"""
        if not PermissionManager.can_manage_group(request.user):
            return Response({"error": "ليس لديك صلاحية إدارة المجموعة"}, status=status.HTTP_403_FORBIDDEN)

        group = self.get_object()
        student_ids = request.data.get('student_ids', [])
        for sid in student_ids:
            user = get_object_or_404(User, id=sid)
            GroupMembers.objects.get_or_create(user=user, group=group)
        return Response({"message": "تم إضافة الأعضاء بنجاح"})

    @action(detail=True, methods=['post'])
    def add_supervisor(self, request, pk=None):
        """Add supervisor to a group"""
        if not PermissionManager.is_admin(request.user):
            return Response({"error": "فقط الإدارة يمكنها تعيين مشرفين"}, status=status.HTTP_403_FORBIDDEN)

        group = self.get_object()
        supervisor_id = request.data.get('supervisor_id')
        supervisor = get_object_or_404(User, id=supervisor_id)
        GroupSupervisors.objects.get_or_create(user=supervisor, group=group)
        return Response({"message": "تم إضافة المشرف بنجاح"})

    @action(detail=True, methods=['post'], url_path='add-member')
    def send_member_approval(self, request, pk=None):
        """Send a group member approval request"""
        group = self.get_object()
        student_id = request.data.get('user_id')
        student = get_object_or_404(User, id=student_id)
        new_approval = GroupMemberApproval.objects.create(
            request=group.creation_request,
            user=student,
            role='student',
            status='pending'
        )
        NotificationManager.create_notification(
            recipient=student,
            notification_type='invitation',
            title='دعوة انضمام',
            message=f'تمت دعوتك للانضمام إلى مجموعة {group.group_name}',
            related_approval=new_approval
        )
        return Response({"message": "تم إرسال الدعوة للطالب بنجاح"})

    @action(detail=False, methods=['get'], url_path='my-group')
    def my_group(self, request):
        """Return the group the user belongs to"""
        user = request.user
        group = Group.objects.filter(groupmembers__user=user).first()
        if group:
            serializer = GroupDetailSerializer(group)
            return Response(serializer.data)
        return Response({"error": "أنت لست عضواً في أي مجموعة حالياً"}, status=status.HTTP_404_NOT_FOUND)


# ============================================================================================
# 2. ApprovalRequestViewSet
# ============================================================================================

class ApprovalRequestViewSet(viewsets.ModelViewSet):
    queryset = ApprovalRequest.objects.all()
    serializer_class = ApprovalRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if PermissionManager.is_admin(user):
            return ApprovalRequest.objects.all()
        return ApprovalRequest.objects.filter(
            models.Q(requested_by=user) | models.Q(current_approver=user)
        ).distinct()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        approval_request = self.get_object()
        user = request.user
        if approval_request.current_approver != user:
            return Response({"error": "ليس لديك صلاحية الموافقة على هذا الطلب"}, status=status.HTTP_403_FORBIDDEN)
        approval_request.status = 'approved'
        approval_request.approved_at = timezone.now()
        approval_request.save()
        return Response({"message": "تمت الموافقة على الطلب بنجاح"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        approval_request = self.get_object()
        user = request.user
        if approval_request.current_approver != user:
            return Response({"error": "ليس لديك صلاحية رفض هذا الطلب"}, status=status.HTTP_403_FORBIDDEN)
        approval_request.status = 'rejected'
        approval_request.comments = request.data.get('comments', approval_request.comments)
        approval_request.save()
        return Response({"message": "تم رفض الطلب بنجاح"}, status=status.HTTP_200_OK)


# ============================================================================================
# 3. GroupInvitationViewSet
# ============================================================================================

class GroupInvitationViewSet(viewsets.ModelViewSet):
    queryset = GroupInvitation.objects.all()
    serializer_class = GroupInvitationSerializer

    def get_queryset(self):
        user = self.request.user
        if PermissionManager.is_student(user):
            return GroupInvitation.objects.filter(invited_student=user)
        if PermissionManager.is_supervisor(user):
            return GroupInvitation.objects.filter(invited_by=user)
        return GroupInvitation.objects.none()

    def create(self, request, *args, **kwargs):
        serializer = CreateGroupInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group = get_object_or_404(Group, group_id=serializer.validated_data['group_id'])
        results = InvitationService.send_invitation(
            group=group,
            invited_student_ids=serializer.validated_data['student_ids'],
            invited_by=request.user
        )
        return Response(results, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        invitation = self.get_object()
        result = InvitationService.accept_invitation(invitation, request.user)
        return Response(result)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        invitation = self.get_object()
        result = InvitationService.reject_invitation(invitation, request.user)
        return Response(result)


# ============================================================================================
# 4. GroupMembersViewSet
# ============================================================================================

class GroupMembersViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GroupMembers.objects.all()
    serializer_class = GroupMembersSerializer

    def get_queryset(self):
        user = self.request.user
        if PermissionManager.is_admin(user):
            return GroupMembers.objects.all()
        return GroupMembers.objects.filter(user=user)


# ============================================================================================
# 5. ProjectViewSet with filtering
# ============================================================================================

class ProjectFilter(django_filters.FilterSet):
    college = django_filters.NumberFilter(field_name="college__cid")
    supervisor = django_filters.NumberFilter(field_name="group__groupsupervisors__user__id")
    year = django_filters.NumberFilter(field_name="start_date__year")

    class Meta:
        model = Project
        fields = ['type', 'state', 'college', 'supervisor', 'year']


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-start_date')
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProjectFilter
    search_fields = ['title', 'description']

    def get_queryset(self):
        user = self.request.user
        qs = Project.objects.all().order_by('-start_date')
        project_type = self.request.query_params.get("type")
        if project_type:
            qs = qs.filter(type=project_type)
        if PermissionManager.is_student(user) or PermissionManager.is_admin(user):
            return qs
        if PermissionManager.is_supervisor(user):
            return qs.filter(group__groupsupervisors__user=user).distinct()
        return qs.none()

    @action(detail=False, methods=['get'], url_path='filter-options')
    def filter_options(self, request):
        try:
            colleges = College.objects.values('cid', 'name_ar')
            college_list = [{"id": c['cid'], "name": c['name_ar']} for c in colleges]

            active_supervisors = User.objects.filter(groupsupervisors__isnull=False).distinct().values('id', 'first_name', 'last_name')
            supervisor_list = [{"id": s['id'], "name": f"{s['first_name']} {s['last_name']}".strip() or "Unnamed Supervisor"} for s in active_supervisors]

            years_qs = Project.objects.annotate(year=ExtractYear('start_date')).values_list('year', flat=True).distinct().order_by('-year')
            years = [str(int(y)) for y in years_qs if y is not None]

            return Response({
                "colleges": college_list,
                "supervisors": supervisor_list,
                "years": years if years else ["2025"],
                "types": list(Project.objects.values_list('type', flat=True).distinct()),
                "states": list(Project.objects.values_list('state', flat=True).distinct())
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=['get'])
    def my_project(self, request):
        user = request.user
        if not PermissionManager.is_student(user):
            return Response({'error': 'Unauthorized'}, status=403)
        project = Project.objects.filter(group__groupmembers__user=user).first()
        if not project:
            return Response({'message': 'No project found'}, status=200)
        return Response(ProjectSerializer(project).data)


# ============================================================================================
# 6. Dropdown data API
# ============================================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dropdown_data(request):
    user = request.user
    user_affiliation = user.academicaffiliation_set.order_by('-start_date').first()
    user_department = user_affiliation.department if user_affiliation else None
    user_college = user_affiliation.college if user_affiliation else None

    # Students
    if PermissionManager.is_student(user) and user_department:
        student_role = Role.objects.filter(type='Student').first()
        students = User.objects.filter(userroles__role=student_role, academicaffiliation__department=user_department).exclude(id=user.id).distinct() if student_role else User.objects.none()
    else:
        students = User.objects.filter(userroles__role__type='Student').exclude(id=user.id).distinct()

    # Supervisors
    if user_college:
        supervisor_role = Role.objects.filter(type='supervisor').first()
        supervisors = User.objects.filter(userroles__role=supervisor_role, academicaffiliation__college=user_college).distinct() if supervisor_role else User.objects.none()
    else:
        supervisors = User.objects.filter(userroles__role__type='supervisor').distinct()

    # Co-supervisors
    if user_college:
        co_supervisor_role = Role.objects.filter(type='Co-supervisor').first()
        assistants = User.objects.filter(userroles__role=co_supervisor_role, academicaffiliation__college=user_college).distinct() if co_supervisor_role else User.objects.none()
    else:
        assistants = User.objects.filter(userroles__role__type='Co-supervisor').distinct()

    return Response({
        "students": [{"id": s.id, "name": s.name} for s in students],
        "supervisors": [{"id": sp.id, "name": sp.name} for sp in supervisors],
        "assistants": [{"id": a.id, "name": a.name} for a in assistants]
    })


# ============================================================================================
# 7. Notifications
# ============================================================================================

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationLogSerializer

    def get_queryset(self):
        return NotificationLog.objects.filter(recipient=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        self.get_queryset().update(status='read')
        return Response({'status': 'success'})


# ============================================================================================
# 11. UserRoles (assign/remove roles to users)
# ============================================================================================

class UserRolesViewSet(viewsets.ModelViewSet):
    queryset = UserRoles.objects.all()
    serializer_class = UserRolesSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Accept either {user: id, role: id} or {user_id, role_id}
        data = request.data
        user_id = data.get('user') or data.get('user_id')
        role_id = data.get('role') or data.get('role_id')
        if not user_id or not role_id:
            return Response({'detail': 'user and role are required'}, status=400)
        # prevent duplicates
        obj, created = UserRoles.objects.get_or_create(user_id=user_id, role_id=role_id)
        serializer = self.get_serializer(obj)
        return Response(serializer.data, status=201 if created else 200)

    def destroy(self, request, *args, **kwargs):
        # support delete by query params ?user_id=&role_id=
        user_id = request.query_params.get('user') or request.query_params.get('user_id')
        role_id = request.query_params.get('role') or request.query_params.get('role_id')
        if user_id and role_id:
            qs = UserRoles.objects.filter(user_id=user_id, role_id=role_id)
            deleted, _ = qs.delete()
            if deleted:
                return Response(status=204)
            return Response({'detail': 'not found'}, status=404)
        return super().destroy(request, *args, **kwargs)


# ============================================================================================
# 8. Roles
# ============================================================================================

class RoleViewSet(viewsets.ModelViewSet):
    """Allow viewing and management of roles. Creation/update/deletion require authentication."""
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]


# ============================================================================================
# 9. Users
# ============================================================================================

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        data = request.data
        user = User.objects.create(username=data['username'], email=data.get('email', ''), name=data.get('name', ''))
        user.set_password(data.get('password', 'password123'))
        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_users(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


# ============================================================================================
# 10. Group creation & approval APIs
# ============================================================================================

@api_view(['POST'])
def submit_group_creation_request(request):
    data = request.data
    user = request.user
    try:
        with transaction.atomic():
            group_request = GroupCreationRequest.objects.create(
                group_name=data['group_name'],
                creator=user,
                department_id=data['department_id'],
                college_id=data['college_id'],
                note=data.get('note', '')
            )
            GroupMemberApproval.objects.create(request=group_request, user=user, role='student', status='accepted', responded_at=timezone.now())
            for student_id in data.get('student_ids', []):
                if int(student_id) != user.id:
                    member = GroupMemberApproval.objects.create(request=group_request, user_id=student_id, role='student')
                    NotificationManager.create_notification(
                        recipient=member.user,
                        notification_type='invitation',
                        title='دعوة انضمام لمجموعة',
                        message=f'دعاك {user.username} للانضمام لمجموعة {group_request.group_name}',
                        related_approval_id=group_request.id
                    )
            for supervisor_id in data.get('supervisor_ids', []):
                member = GroupMemberApproval.objects.create(request=group_request, user_id=supervisor_id, role='supervisor')
                NotificationManager.create_notification(
                    recipient=member.user,
                    notification_type='approval_request',
                    title='طلب إشراف على مجموعة',
                    message=f'طلب منك الطالب {user.username} الإشراف على مجموعة {group_request.group_name}',
                    related_approval_id=group_request.id
                )
            return Response({"message": "تم تقديم الطلب بنجاح وهو قيد انتظار موافقة الجميع", "request_id": group_request.id}, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['POST'])
def respond_to_group_request(request, approval_id):
    user = request.user
    response_status = request.data.get('status')
    try:
        approval = GroupMemberApproval.objects.get(id=approval_id, user=user)
        if approval.status != 'pending':
            return Response({"error": "لقد قمت بالرد على هذا الطلب مسبقاً"}, status=400)
        approval.status = response_status
        approval.responded_at = timezone.now()
        approval.save()
        message = "تمت الموافقة" if response_status == 'accepted' else "تم رفض الطلب"
        if response_status == 'accepted':
            is_finalized = check_and_finalize_group(approval.request.id)
            if is_finalized:
                message = "تمت الموافقة، واكتمل إنشاء المجموعة رسمياً!"
        return Response({"message": message})
    except GroupMemberApproval.DoesNotExist:
        return Response({"error": "الطلب غير موجود أو ليس لديك صلاحية"}, status=404)
