import React, { useEffect, useState } from 'react';
import { projectService, Project } from '../../../services/projectService';
import { userService, User } from '../../../services/userService';
import { FiDownload } from 'react-icons/fi';
import { exportToCSV } from '../../../components/tableUtils';
import { containerClass, tableWrapperClass, tableClass, theadClass } from '../../../components/tableStyles';

interface ProjectWithUsers extends Project {
  users?: User[]; // optional: users associated with this project
}

const ProjectsTable: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleRows, setVisibleRows] = useState<number>(10);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<any>({ college: '', supervisor: '', year: '', type: '', state: '' });
  const [filterOptions, setFilterOptions] = useState<any>({ colleges: [], supervisors: [], years: [], types: [], states: [] });
  const [collegeInput, setCollegeInput] = useState('');
  const [supervisorInput, setSupervisorInput] = useState('');
  const [yearInput, setYearInput] = useState('');
  const [typeInput, setTypeInput] = useState('');
  const [stateInput, setStateInput] = useState('');

  // fetchProjects moved to component scope so filters can call it
  const fetchProjects = async (params?: any) => {
    setLoading(true);
    console.log('[ProjectsTable] fetchProjects called (bulk)');
    try {
      // First fetch projects with optional filters/search
      const paramsToSend = params ? { ...params } : {};
      if (search) paramsToSend.search = search;
      console.log('[ProjectsTable] fetching projects with params:', paramsToSend);
      const projectsResp = await projectService.getProjects(paramsToSend);
      console.log('[ProjectsTable] projects response:', projectsResp);
      const projectsRaw = Array.isArray(projectsResp) ? projectsResp : (projectsResp.results || []);

      // Then fetch related tables for enrichment
      const bulk = await projectService.getProjectsWithGroups();
      console.log('[ProjectsTable] bulk fetched:', bulk);
      const groups = Array.isArray(bulk.groups) ? bulk.groups : [];
      const groupMembers = Array.isArray(bulk.group_members) ? bulk.group_members : [];
      const groupSupervisors = Array.isArray(bulk.group_supervisors) ? bulk.group_supervisors : [];
      const users = Array.isArray(bulk.users) ? bulk.users : [];
      const colleges = Array.isArray(bulk.colleges) ? bulk.colleges : [];

      console.log('[ProjectsTable] counts:', {
        projects: projectsRaw.length,
        groups: groups.length,
        groupMembers: groupMembers.length,
        groupSupervisors: groupSupervisors.length,
        users: users.length,
        colleges: colleges.length,
      });

      const usersById = new Map<number, any>(users.map((u: any) => [u.id, u]));
      const collegesById = new Map<any, any>(colleges.map((c: any) => [c.cid, c.name_ar]));

      const projectsWithUsers: ProjectWithUsers[] = projectsRaw.map((p: any) => {
        const relatedGroups = groups.filter((g: any) => g.project === p.project_id);
        const mainGroup = relatedGroups.length ? relatedGroups[0] : null;
        const groupId = mainGroup ? mainGroup.group_id : null;

        // students
        const memberRows = groupMembers.filter((m: any) => m.group === groupId);
        const students = memberRows
          .map((m: any) => {
            const u = usersById.get(m.user);
            if (!u) return null;
            return { ...u, displayName: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() };
          })
          .filter(Boolean);

        // supervisors
        const supRows = groupSupervisors.filter((s: any) => s.group === groupId && s.type === 'supervisor');
        const coSupRows = groupSupervisors.filter((s: any) => s.group === groupId && (s.type === 'co_supervisor' || s.type === 'co-supervisor' || s.type === 'co supervisor'));
        const supervisorUser = supRows.length ? usersById.get(supRows[0].user) : null;
        const coSupervisorUser = coSupRows.length ? usersById.get(coSupRows[0].user) : null;

        const collegeName = collegesById.get(p.college) || p.college || '-';

        return {
          ...p,
          users: students,
          group_name: mainGroup ? mainGroup.group_name : null,
          supervisor: supervisorUser ? { ...supervisorUser, name: supervisorUser.name || `${supervisorUser.first_name || ''} ${supervisorUser.last_name || ''}`.trim() } : null,
          co_supervisor: coSupervisorUser ? { ...coSupervisorUser, name: coSupervisorUser.name || `${coSupervisorUser.first_name || ''} ${coSupervisorUser.last_name || ''}`.trim() } : null,
          college_name: collegeName,
        };
      });

      console.log('[ProjectsTable] processed projects:', projectsWithUsers);

      // Client-side fallback for supervisor filter: if backend didn't filter, apply locally
      const supervisorFilter = paramsToSend?.supervisor || params?.supervisor;
      if (supervisorFilter) {
        const supIdStr = String(supervisorFilter);
        const filtered = projectsWithUsers.filter((p: any) => {
          const relatedGroup = groups.find((g: any) => g.project === p.project_id);
          const groupId = relatedGroup ? relatedGroup.group_id : null;
          if (!groupId) return false;
          return groupSupervisors.some((s: any) => String(s.group) === String(groupId) && String(s.user) === supIdStr);
        });
        console.log('[ProjectsTable] applied client-side supervisor filter, kept:', filtered.length);
        setProjects(filtered);
      } else {
        setProjects(projectsWithUsers);
      }
    } catch (err) {
      console.error('[ProjectsTable] Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // load filter options on mount
    (async () => {
      try {
        const opts = await projectService.getFilterOptions();
        console.log('[ProjectsTable] filter options:', opts);
        setFilterOptions(opts);
        // initialize display inputs for searchable filters when options are loaded
        if (opts.colleges && opts.colleges.length && filters.college) {
          const c = opts.colleges.find((x: any) => String(x.id) === String(filters.college));
          if (c) setCollegeInput(`${c.id}::${c.name}`);
        }
        if (opts.supervisors && opts.supervisors.length && filters.supervisor) {
          const s = opts.supervisors.find((x: any) => String(x.id) === String(filters.supervisor));
          if (s) setSupervisorInput(`${s.id}::${s.name}`);
        }
        if (opts.years && opts.years.length && filters.year) {
          const y = opts.years.find((x: any) => String(x) === String(filters.year));
          if (y) setYearInput(`::${y}`);
        }
        if (opts.types && opts.types.length && filters.type) {
          const t = opts.types.find((x: any) => String(x) === String(filters.type));
          if (t) setTypeInput(`::${t}`);
        }
        if (opts.states && opts.states.length && filters.state) {
          const st = opts.states.find((x: any) => String(x) === String(filters.state));
          if (st) setStateInput(`::${st}`);
        }
      } catch (e) {
        console.error('[ProjectsTable] failed to load filter options', e);
      }
    })();

    // initial load
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-apply when filters (non-search) change. Search waits for Enter.
  React.useEffect(() => {
    const p: any = {};
    if (filters.college) p.college = Number(filters.college);
    if (filters.supervisor) p.supervisor = Number(filters.supervisor);
    if (filters.year) p.year = Number(filters.year);
    if (filters.type) p.type = filters.type;
    if (filters.state) p.state = filters.state;
    fetchProjects(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.college, filters.supervisor, filters.year, filters.type, filters.state]);

  const applyFilters = () => {
    const p: any = {};
    if (filters.college) p.college = Number(filters.college);
    if (filters.supervisor) p.supervisor = Number(filters.supervisor);
    if (filters.year) p.year = Number(filters.year);
    if (filters.type) p.type = filters.type;
    if (filters.state) p.state = filters.state;
    console.log('[ProjectsTable] applyFilters -> sending params:', p, 'search:', search);
    fetchProjects(p);
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({ college: '', supervisor: '', year: '', type: '', state: '' });
    fetchProjects();
  };

  if (loading) return <div className="p-6 text-center">Loading projects...</div>;

  if (projects.length === 0) return <div className="p-6 text-center">لا توجد مشاريع</div>;

  return (
    <div className={containerClass}>
      <div className="mb-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">بحث</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyFilters();
                  }
                }}
                placeholder="بحث بعنوان المشروع أو الوصف"
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">الكلية</label>
              <input
                list="colleges-list"
                value={collegeInput}
                onChange={e => {
                  const v = e.target.value;
                  setCollegeInput(v);
                  const parts = String(v).split('::');
                  if (parts.length === 2) setFilters(f => ({ ...f, college: Number(parts[0]) }));
                  else setFilters(f => ({ ...f, college: '' }));
                }}
                placeholder="ابحث او اختر كلية"
                className="w-full border rounded px-2 py-2"
              />
              <datalist id="colleges-list">
                {filterOptions.colleges?.map((c: any) => (
                  <option key={c.id} value={`${c.id}::${c.name}`}>
                    {c.name}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">المشرف</label>
              <input
                list="supervisors-list"
                value={supervisorInput}
                onChange={e => {
                  const v = e.target.value;
                  setSupervisorInput(v);
                  const parts = String(v).split('::');
                  if (parts.length === 2) setFilters(f => ({ ...f, supervisor: Number(parts[0]) }));
                  else setFilters(f => ({ ...f, supervisor: '' }));
                }}
                placeholder="ابحث او اختر مشرف"
                className="w-full border rounded px-2 py-2"
              />
              <datalist id="supervisors-list">
                {filterOptions.supervisors?.map((s: any) => (
                  <option key={s.id} value={`${s.id}::${s.name}`}>
                    {s.name}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">السنة</label>
              <input
                list="years-list"
                value={yearInput}
                onChange={e => {
                  const v = e.target.value;
                  setYearInput(v);
                  const parts = String(v).split('::');
                  if (parts.length === 2) setFilters(f => ({ ...f, year: parts[1] }));
                  else setFilters(f => ({ ...f, year: v }));
                }}
                placeholder="ابحث او اختر سنة"
                className="w-full border rounded px-2 py-2"
              />
              <datalist id="years-list">
                {filterOptions.years?.map((y: any) => (
                  <option key={y} value={`::${y}`}>
                    {y}
                  </option>
                ))}
              </datalist>
            </div>
            
            <div>
              <label className="block text-xs text-slate-500 mb-1">النوع</label>
              <input
                list="types-list"
                value={typeInput}
                onChange={e => {
                  const v = e.target.value;
                  setTypeInput(v);
                  const parts = String(v).split('::');
                  if (parts.length === 2) setFilters(f => ({ ...f, type: parts[1] }));
                  else setFilters(f => ({ ...f, type: v }));
                }}
                placeholder="ابحث او اختر نوع المشروع"
                className="w-full border rounded px-2 py-2"
              />
              <datalist id="types-list">
                {filterOptions.types?.map((t: any, idx: number) => (
                  <option key={idx} value={`::${t}`}>
                    {t}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">الحالة</label>
              <input
                list="states-list"
                value={stateInput}
                onChange={e => {
                  const v = e.target.value;
                  setStateInput(v);
                  const parts = String(v).split('::');
                  if (parts.length === 2) setFilters(f => ({ ...f, state: parts[1] }));
                  else setFilters(f => ({ ...f, state: v }));
                }}
                placeholder="ابحث او اختر حالة"
                className="w-full border rounded px-2 py-2"
              />
              <datalist id="states-list">
                {filterOptions.states?.map((s: any, idx: number) => (
                  <option key={idx} value={`::${s}`}>
                    {s}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          <div className="mt-3 flex justify-end items-center gap-2">
            <button onClick={() => exportToCSV('projects.csv', projects)} className="text-sm bg-blue-700 text-white rounded px-3 py-1">تصدير</button>
            <button onClick={clearFilters} className="text-sm bg-gray-50 border rounded px-3 py-1 text-gray-700">مسح الكل</button>
          </div>
        </div>
      </div>
      <div className={tableWrapperClass}>
        <table className={tableClass + ' min-w-full'}>
          <thead className={theadClass}>
          <tr>
            <th className="px-4 py-2 text-right">عنوان المشروع</th>
            <th className="px-4 py-2 text-right">نوع المشروع</th>
            <th className="px-4 py-2 text-right">الحالة</th>
            <th className="px-4 py-2 text-right">الملخص</th>
            <th className="px-4 py-2 text-right">المشرف</th>
            <th className="px-4 py-2 text-right">اسم المجموعة</th>
            <th className="px-4 py-2 text-right">المشرف المشارك</th>
            <th className="px-4 py-2 text-right">الكلية</th>
            <th className="px-4 py-2 text-right">السنة</th>
            <th className="px-4 py-2 text-right">المستخدمون</th>
            <th className="px-4 py-2 text-center">ملف المشروع</th>
          </tr>
        </thead>
        <tbody>
          {projects.slice(0, visibleRows).map((proj) => (
            <tr key={proj.project_id} className="border-b last:border-b-0">
              <td className="px-4 py-2 text-right">{proj.title}{proj.group_name ? ` — ${proj.group_name}` : ''}</td>
              <td className="px-4 py-2 text-right">{proj.type}</td>
              <td className="px-4 py-2 text-right">{proj.state}</td>
              <td className="px-4 py-2 text-right">{proj.description}</td>
              <td className="px-4 py-2 text-right">{proj.supervisor?.name || '-'}</td>
              <td className="px-4 py-2 text-right">{(proj as any).group_name || '-'}</td>
              <td className="px-4 py-2 text-right">{proj.co_supervisor?.name || '-'}</td>
              <td className="px-4 py-2 text-right">{(proj as any).college_name || '-'}</td>
              <td className="px-4 py-2 text-right">{proj.start_date ? new Date(proj.start_date).getFullYear() : '-'}</td>
              <td className="px-4 py-2 text-right">
                {proj.users?.length ? proj.users.map((u: any) => u.displayName || u.name).join(', ') : '-'}
              </td>
              <td className="px-4 py-2 text-center">
                <button
                  className="text-primary-700 hover:opacity-80 flex items-center justify-center gap-1"
                  onClick={() => projectService.downloadProjectFile(proj.project_id)}
                >
                  <FiDownload /> تنزيل
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Show more/less */}
    {!loading && projects.length > visibleRows && (
      <div className="mt-4 flex justify-center">
        <button onClick={() => setVisibleRows(v => v + 10)} className="px-4 py-2 bg-white border rounded">عرض المزيد ({projects.length - visibleRows} متبقي)</button>
      </div>
    )}
    {!loading && visibleRows > 10 && (
      <div className="mt-2 flex justify-center">
        <button onClick={() => setVisibleRows(10)} className="text-sm text-slate-500 underline">عرض أقل</button>
      </div>
    )}

  </div>
  );
};

export default ProjectsTable;
