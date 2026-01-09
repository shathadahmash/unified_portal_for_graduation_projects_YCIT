# core/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    City, University, Branch, College, Department, Program,
    User, Project, Group, Notification, AcademicAffiliation,
    GroupMembers, GroupSupervisors, Role, Permission, RolePermission,
    UserRoles, GroupInvitation, ApprovalRequest, NotificationLog,
    SystemSettings, ApprovalSequence , ProgressStage,
    ProgressPattern,
    PatternStageAssignment,
    CollegeProgressPattern,
    DepartmentProgressPattern
)

# ============================================================================== 
# 1. إدارة مراحل التقدم (ProgressStage)
# ============================================================================== 
@admin.register(ProgressStage)
class ProgressStageAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description')
    search_fields = ('name', 'description')


# ============================================================================== 
# 2. إدارة أنماط التقدم (ProgressPattern) مع Inline للمراحل
# ============================================================================== 
class PatternStageAssignmentInline(admin.TabularInline):
    model = PatternStageAssignment
    extra = 1
    ordering = ('order',)
    fields = ('stage', 'order', 'max_mark')


@admin.register(ProgressPattern)
class ProgressPatternAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)
    inlines = [PatternStageAssignmentInline]  # Use inline instead of filter_horizontal


# ============================================================================== 
# 3. إدارة ربط الأنماط بالمراحل (PatternStageAssignment)
# ============================================================================== 
@admin.register(PatternStageAssignment)
class PatternStageAssignmentAdmin(admin.ModelAdmin):
    list_display = ('pattern', 'stage', 'order', 'max_mark')
    list_filter = ('pattern',)
    search_fields = ('pattern__name', 'stage__name')


# ============================================================================== 
# 4. إدارة أنماط التقدم الخاصة بالكليات (CollegeProgressPattern)
# ============================================================================== 
@admin.register(CollegeProgressPattern)
class CollegeProgressPatternAdmin(admin.ModelAdmin):
    list_display = ('college', 'pattern', 'is_default', 'assigned_at')
    list_filter = ('college', 'is_default')
    search_fields = ('college__name_ar', 'pattern__name')


# ============================================================================== 
# 5. إدارة أنماط التقدم الخاصة بالأقسام (DepartmentProgressPattern)
# ============================================================================== 
@admin.register(DepartmentProgressPattern)
class DepartmentProgressPatternAdmin(admin.ModelAdmin):
    list_display = ('department', 'pattern', 'is_default', 'assigned_at')
    list_filter = ('department', 'is_default')
    search_fields = ('department__name', 'pattern__name')

# ==============================================================================
# 1. إدارة المستخدمين
# ==============================================================================
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'name', 'email', 'phone', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'date_joined')
    search_fields = ('username', 'name', 'email', 'phone')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('إضافات مخصصة', {'fields': ('phone', 'company_name', 'name', 'gender')}),
    )


# ==============================================================================
# 2. إدارة الموقع الجغرافي
# ==============================================================================
@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('bid', 'bname_ar', 'bname_en')
    search_fields = ('bname_ar', 'bname_en')


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ('uid', 'uname_ar', 'uname_en', 'type')
    search_fields = ('uname_ar', 'uname_en')


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('ubid', 'university', 'city', 'location')
    list_filter = ('university', 'city')
    search_fields = ('location', 'address')


@admin.register(College)
class CollegeAdmin(admin.ModelAdmin):
    list_display = ('cid', 'name_ar', 'branch')
    list_filter = ('branch',)
    search_fields = ('name_ar', 'name_en')


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('department_id', 'name', 'college')
    list_filter = ('college',)
    search_fields = ('name',)


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('pid', 'p_name', 'department')
    list_filter = ('department',)
    search_fields = ('p_name',)


# ==============================================================================
# 3. إدارة الأدوار والصلاحيات
# ==============================================================================
@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('role_ID', 'type', 'role_type')
    search_fields = ('type', 'role_type')


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('perm_ID', 'name')
    search_fields = ('name',)


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'permission')
    list_filter = ('role',)


@admin.register(UserRoles)
class UserRolesAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    list_filter = ('role',)
    search_fields = ('user__username',)


# ==============================================================================
# 4. إدارة المشاريع والمجموعات
# ==============================================================================
# ==============================================================================
# 4. إدارة المشاريع والمجموعات
# ==============================================================================
@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    # إضافة 'college' هنا لعرضها في الجدول الرئيسي للمشاريع
    list_display = ('project_id', 'title', 'get_college_name', 'type', 'state', 'start_date')
    
    # إضافة الفلترة حسب الكلية لتسهيل البحث
    list_filter = ('college', 'type', 'state', 'start_date')
    
    search_fields = ('title', 'description', 'college__name_ar')
    readonly_fields = ('project_id',)

    # تحسين شكل صفحة الإضافة (Add Project) ليكون اختيار الكلية في البداية
    fieldsets = (
        ('الارتباط الأكاديمي', {
            'fields': ('college',)
        }),
        ('معلومات المشروع الأساسية', {
            'fields': ('title', 'description', 'type', 'state')
        }),
        ('التواريخ', {
            'fields': ('start_date', 'end_date')
        }),
    )

    # دالة لعرض اسم الكلية بالعربي في الجدول الرئيسي
    def get_college_name(self, obj):
        return obj.college.name_ar if obj.college else "غير مرتبط بكلية"
    get_college_name.short_description = 'الكلية'
    
@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    # 1. الحقول التي تظهر في القائمة الرئيسية
    list_display = (
        'group_name', 
        'get_department', 
        'program', 
        'academic_year', 
        'pattern', 
        'project', 
        'created_at'
    )

    # 2. إضافة فلاتر جانبية لتسهيل الوصول
    list_filter = (
        'academic_year', 
        'program__department', 
        'program', 
        'pattern'
    )

    # 3. إضافة شريط بحث (يبحث في اسم المجموعة، البرنامج، والمشروع)
    search_fields = (
        'group_name', 
        'program__p_name', 
        'project__title'
    )

    # 4. تنظيم الحقول داخل صفحة الإضافة والتعديل (Fieldsets)
    fieldsets = (
        ('Basic Information', {
            'fields': ('group_name', 'academic_year')
        }),
        ('Academic Context', {
            'fields': ('department', 'program', 'pattern')
        }),
        ('Project Assignment', {
            'fields': ('project',)
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',), # إخفاء هذا القسم افتراضياً
        }),
    )

    # 5. جعل حقل التاريخ للقراءة فقط لأنه auto_now_add
    readonly_fields = ('created_at',)

    # 6. تحسين واجهة اختيار العلاقات (بدلاً من القائمة المنسدلة الطويلة)
    raw_id_fields = ('project',) # مفيد جداً إذا كان عدد المشاريع كبيراً جداً
    autocomplete_fields = ('program', 'pattern') # يتطلب وجود search_fields في Admin الخاص بهما

    # 7. دالة مخصصة لعرض القسم في القائمة (لأن العلاقة عبر البرنامج)
    def get_department(self, obj):
        if obj.program:
            return obj.program.department
        return obj.department
    get_department.short_description = 'Department'

    # 8. (اختياري) تصفية الأنماط المتاحة بناءً على القسم المختار
    # ملاحظة: هذا يعمل بشكل ثابت عند تحميل الصفحة
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "pattern":
            # يمكنك هنا إضافة منطق لتصفية الأنماط إذا أردت
            pass
        return super().formfield_for_foreignkey(db_field, request, **kwargs)




@admin.register(GroupMembers)
class GroupMembersAdmin(admin.ModelAdmin):
    list_display = ('user', 'group')
    list_filter = ('group',)
    search_fields = ('user__username', 'group__group_name')


@admin.register(GroupSupervisors)
class GroupSupervisorsAdmin(admin.ModelAdmin):
    list_display = ('user', 'group')
    list_filter = ('group',)
    search_fields = ('user__username', 'group__group_name')


# ==============================================================================
# 5. إدارة الدعوات والموافقات والإشعارات
# ==============================================================================
@admin.register(GroupInvitation)
class GroupInvitationAdmin(admin.ModelAdmin):
    list_display = ('invitation_id', 'group', 'invited_student', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('invited_student__username', 'group__group_name')
    readonly_fields = ('created_at', 'responded_at')


@admin.register(ApprovalRequest)
class ApprovalRequestAdmin(admin.ModelAdmin):
    list_display = ('approval_id', 'approval_type', 'status', 'approval_level', 'created_at')
    list_filter = ('approval_type', 'status', 'approval_level')
    search_fields = ('group__group_name', 'project__title')
    readonly_fields = ('created_at', 'updated_at', 'approved_at')


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ('notification_id', 'recipient', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('recipient__username', 'title', 'message')
    readonly_fields = ('created_at', 'read_at')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('not_ID', 'user', 'state', 'date')
    list_filter = ('state', 'date')
    search_fields = ('user__username', 'message')
    readonly_fields = ('date',)


# ==============================================================================
# 6. إدارة الإعدادات والتسلسلات
# ==============================================================================
@admin.register(AcademicAffiliation)
class AcademicAffiliationAdmin(admin.ModelAdmin):
    list_display = ('affiliation_id', 'user', 'university', 'college', 'department', 'start_date')
    list_filter = ('university', 'college', 'department', 'start_date')
    search_fields = ('user__username', 'college__name_ar', 'department__name')
    
    # لترتيب وتوضيح النموذج داخل صفحة الإضافة/التعديل
    fieldsets = (
        ('معلومات المستخدم', {
            'fields': ('user',)
        }),
        ('البيانات الأكاديمية', {
            'fields': ('university', 'college', 'department')
        }),
        ('المدة الزمنية', {
            'fields': ('start_date', 'end_date')
        }),
    )


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ('setting_key', 'setting_value', 'updated_at')
    search_fields = ('setting_key',)
    readonly_fields = ('updated_at',)


@admin.register(ApprovalSequence)
class ApprovalSequenceAdmin(admin.ModelAdmin):
    list_display = ('sequence_id', 'sequence_type', 'approval_levels')
    search_fields = ('sequence_type',)
