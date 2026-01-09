from rest_framework import serializers
import json
from django.utils import timezone
from .models import (
    City, University, Branch, College, Department, Program,
    User, Role, UserRoles, Permission, RolePermission,
    Group, GroupMembers, GroupSupervisors,
    Project, GroupInvitation, ApprovalRequest,
    NotificationLog, Notification,
    GroupCreationRequest, AcademicAffiliation, GroupMemberApproval
)

# ==============================================================================
# 1. Serializers الموقع الجغرافي (Cities / Universities / Branches / Colleges)
# ==============================================================================

class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['bid', 'bname_ar', 'bname_en']


class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = ['uid', 'uname_ar', 'uname_en', 'type']


class BranchSerializer(serializers.ModelSerializer):
    university_detail = UniversitySerializer(source='university', read_only=True)
    city_detail = CitySerializer(source='city', read_only=True)

    class Meta:
        model = Branch
        fields = [
            'ubid',
            'university', 'university_detail',
            'city', 'city_detail',
            'location', 'address', 'contact'
        ]


class CollegeSerializer(serializers.ModelSerializer):
    branch_detail = BranchSerializer(source='branch', read_only=True)

    class Meta:
        model = College
        fields = [
            'cid', 'name_ar', 'name_en', 'branch', 'branch_detail'
        ]


class DepartmentSerializer(serializers.ModelSerializer):
    college_detail = CollegeSerializer(source='college', read_only=True)

    class Meta:
        model = Department
        fields = [
            'department_id', 'name', 'description', 'college', 'college_detail'
        ]


class ProgramSerializer(serializers.ModelSerializer):
    department_detail = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = Program
        fields = ['pid', 'p_name', 'department', 'department_detail']


# ==============================================================================
# 2. Serializers المستخدمين
# ==============================================================================

class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    department_id = serializers.SerializerMethodField()
    college_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'email', 'phone', 'gender', 'roles', 'department_id', 'college_id']

    def get_roles(self, obj):
        return list(UserRoles.objects.filter(user=obj).values('role__role_ID', 'role__type'))

    def get_department_id(self, obj):
        affiliation = getattr(obj, 'academicaffiliation', None)
        return affiliation.department.id if affiliation and affiliation.department else None

    def get_college_id(self, obj):
        affiliation = getattr(obj, 'academicaffiliation', None)
        return affiliation.college.id if affiliation and affiliation.college else None


class UserDetailSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['company_name', 'date_joined']


class AcademicAffiliationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    university = UniversitySerializer(read_only=True)
    college = CollegeSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)

    class Meta:
        model = AcademicAffiliation
        fields = '__all__'


# ==============================================================================
# 3. Serializers المجموعات
# ==============================================================================

class GroupMembersSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = GroupMembers
        fields = ['user', 'user_detail', 'group']


class GroupSupervisorsSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = GroupSupervisors
        fields = ['user', 'user_detail', 'group', 'type']


class GroupSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()
    supervisors = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ['group_id', 'group_name', 'project', 'members', 'supervisors', 'members_count']

    def get_members(self, obj):
        qs = GroupMembers.objects.filter(group=obj)
        return GroupMembersSerializer(qs, many=True).data

    def get_supervisors(self, obj):
        qs = GroupSupervisors.objects.filter(group=obj)
        return GroupSupervisorsSerializer(qs, many=True).data

    def get_members_count(self, obj):
        return GroupMembers.objects.filter(group=obj).count()


class GroupDetailSerializer(GroupSerializer):
    project_detail = serializers.SerializerMethodField()

    class Meta(GroupSerializer.Meta):
        fields = GroupSerializer.Meta.fields + ['project_detail']

    def get_project_detail(self, obj):
        if not obj.project:
            return None
        return {
            'project_id': obj.project.project_id,
            'title': obj.project.title,
            'type': obj.project.type,
            'state': obj.project.state,
        }


# ==============================================================================
# 4. Serializers الدعوات
# ==============================================================================

class GroupInvitationSerializer(serializers.ModelSerializer):
    invited_student_detail = UserSerializer(source='invited_student', read_only=True)
    invited_by_detail = UserSerializer(source='invited_by', read_only=True)
    group_detail = GroupSerializer(source='group', read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = GroupInvitation
        fields = '__all__'

    def get_is_expired(self, obj):
        return obj.is_expired()


class CreateGroupInvitationSerializer(serializers.Serializer):
    group_id = serializers.IntegerField()
    student_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)

    def validate_student_ids(self, value):
        if not value:
            raise serializers.ValidationError("يجب تحديد طالب واحد على الأقل")
        return value


# ==============================================================================
# 5. Serializers المشاريع
# ==============================================================================

class ProjectSerializer(serializers.ModelSerializer):
    college_name = serializers.CharField(source='college.name_ar', read_only=True)
    year = serializers.SerializerMethodField()
    supervisor_name = serializers.SerializerMethodField()
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Project
        fields = [
            'project_id', 'title', 'type', 'college', 'college_name',
            'supervisor_name', 'start_date', 'end_date', 'year', 'state', 'description', 'created_by'
        ]

    def get_year(self, obj):
        return obj.start_date.year if obj.start_date else None

    def get_supervisor_name(self, obj):
        rel = GroupSupervisors.objects.filter(group__project=obj, type='supervisor').select_related('user').first()
        if rel and rel.user:
            return rel.user.name
        return "لا يوجد مشرف"


# ==============================================================================
# 6. Serializers الموافقات
# ==============================================================================

class ApprovalRequestSerializer(serializers.ModelSerializer):
    requested_by_detail = UserSerializer(source='requested_by', read_only=True)
    current_approver_detail = UserSerializer(source='current_approver', read_only=True)
    group_detail = GroupSerializer(source='group', read_only=True)

    class Meta:
        model = ApprovalRequest
        fields = '__all__'


# ==============================================================================
# 7. Serializers إنشاء المجموعات
# ==============================================================================

class GroupCreateSerializer(serializers.Serializer):
    group_name = serializers.CharField(max_length=255)
    project_title = serializers.CharField(max_length=500)
    project_type = serializers.CharField(max_length=100)
    project_description = serializers.CharField()
    student_ids = serializers.ListField(child=serializers.IntegerField(), required=True)
    supervisor_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=[])
    co_supervisor_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=[])
    department_id = serializers.IntegerField(required=True)
    college_id = serializers.IntegerField(required=True)

    def validate(self, data):
        MAX_STUDENTS, MAX_SUPERVISORS, MAX_CO_SUPERVISORS = 5, 3, 2
        if len(data['student_ids']) > MAX_STUDENTS:
            raise serializers.ValidationError(f"الحد الأقصى للطلاب هو {MAX_STUDENTS}")
        if len(data['supervisor_ids']) > MAX_SUPERVISORS:
            raise serializers.ValidationError(f"الحد الأقصى للمشرفين هو {MAX_SUPERVISORS}")
        if len(data['co_supervisor_ids']) > MAX_CO_SUPERVISORS:
            raise serializers.ValidationError(f"الحد الأقصى للمشرفين المساعدين هو {MAX_CO_SUPERVISORS}")
        all_ids = data['student_ids'] + data['supervisor_ids'] + data['co_supervisor_ids']
        if len(all_ids) != len(set(all_ids)):
            raise serializers.ValidationError("يجب أن تكون قائمة الأعضاء والمشرفين فريدة (لا يوجد تكرار)")
        users = User.objects.filter(id__in=all_ids)
        if users.count() != len(all_ids):
            raise serializers.ValidationError("تحقق من صحة معرفات المستخدمين المدخلة")
        try:
            Department.objects.get(department_id=data['department_id'])
            College.objects.get(cid=data['college_id'])
        except (Department.DoesNotExist, College.DoesNotExist):
            raise serializers.ValidationError("القسم أو الكلية المحددة غير صالحة")
        request = self.context.get('request')
        if request and request.user.id not in data['student_ids']:
            raise serializers.ValidationError("يجب أن يكون الطالب المنشئ للمجموعة ضمن قائمة الطلاب")
        data['users'] = users
        return data

    def create(self, validated_data):
        project = Project.objects.create(
            title=validated_data['project_title'],
            type=validated_data['project_type'],
            description=validated_data['project_description'],
            start_date=timezone.now().date(),
            state='Pending Approval'
        )
        group_data = {
            'group_name': validated_data['group_name'],
            'project_id': project.project_id,
            'project_title': validated_data['project_title'],
            'project_type': validated_data['project_type'],
            'project_description': validated_data['project_description'],
            'student_ids': validated_data['student_ids'],
            'supervisor_ids': validated_data['supervisor_ids'],
            'co_supervisor_ids': validated_data['co_supervisor_ids'],
            'department_id': validated_data['department_id'],
            'college_id': validated_data['college_id'],
        }
        requested_by = self.context['request'].user
        approval_request = ApprovalRequest.objects.create(
            approval_type='project_proposal',
            project=project,
            requested_by=requested_by,
            current_approver=requested_by,
            comments=json.dumps(group_data),
            status='pending'
        )
        return approval_request


# ==============================================================================
# 8. Serializers الإشعارات
# ==============================================================================

class NotificationLogSerializer(serializers.ModelSerializer):
    recipient_detail = UserSerializer(source='recipient', read_only=True)
    related_user_detail = UserSerializer(source='related_user', read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    related_group_name = serializers.CharField(source='related_group.group_name', read_only=True, allow_null=True)
    related_user_name = serializers.CharField(source='related_user.name', read_only=True, allow_null=True)
    related_approval_type = serializers.CharField(source='related_approval.get_approval_type_display', read_only=True, allow_null=True)

    class Meta:
        model = NotificationLog
        fields = [
            'notification_id',
            'recipient', 'recipient_detail',
            'notification_type', 'notification_type_display',
            'title', 'message',
            'related_group', 'related_group_name',
            'related_project',
            'related_user', 'related_user_name', 'related_user_detail',
            'related_approval_type',
            'is_read', 'is_sent_email',
            'created_at', 'read_at',
        ]
        read_only_fields = fields


class NotificationSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Notification
        fields = '__all__'


# ==============================================================================
# 9. Serializers الأدوار والصلاحيات
# ==============================================================================

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['role_ID', 'type', 'role_type']

    def validate_type(self, value):
        # Prevent duplicate role names (case-insensitive)
        qs = Role.objects.filter(type__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("دور بنفس الاسم موجود بالفعل")
        return value


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['perm_ID', 'name', 'Description']


class RolePermissionSerializer(serializers.ModelSerializer):
    role_detail = RoleSerializer(source='role', read_only=True)
    permission_detail = PermissionSerializer(source='permission', read_only=True)

    class Meta:
        model = RolePermission
        fields = ['id', 'role', 'role_detail', 'permission', 'permission_detail']


class UserRolesSerializer(serializers.ModelSerializer):
    user_detail = serializers.StringRelatedField(source='user', read_only=True)
    role_detail = RoleSerializer(source='role', read_only=True)

    class Meta:
        model = UserRoles
        fields = ['id', 'user', 'user_detail', 'role', 'role_detail']
