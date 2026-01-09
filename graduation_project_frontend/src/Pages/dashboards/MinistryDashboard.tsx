// import React, { useState } from 'react';
// import { useAuthStore, useApprovalsStore } from '../../store/useStore';
// import Layout from '../../components/Layout';

// const MinistryDashboard: React.FC = () => {
//   const { user } = useAuthStore();
//   const { pendingApprovals } = useApprovalsStore();
//   const [activeTab, setActiveTab] = useState('home');

//   return (
//     <Layout>
//       <div className="p-6 space-y-6">
//         <h1 className="text-3xl font-bold">مرحباً، {user?.name}</h1>

//         {/* بطاقات إحصائية */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           <div className="bg-white p-6 rounded-lg shadow border-r-4 border-yellow-500">
//             <p className="text-gray-600 text-sm">موافقات معلقة</p>
//             <p className="text-3xl font-bold">{pendingApprovals.length}</p>
//           </div>
//           <div className="bg-white p-6 rounded-lg shadow border-r-4 border-blue-500">
//             <p className="text-gray-600 text-sm">الجامعات</p>
//             <p className="text-3xl font-bold">10</p>
//           </div>
//           <div className="bg-white p-6 rounded-lg shadow border-r-4 border-green-500">
//             <p className="text-gray-600 text-sm">الكليات</p>
//             <p className="text-3xl font-bold">80</p>
//           </div>
//           <div className="bg-white p-6 rounded-lg shadow border-r-4 border-purple-500">
//             <p className="text-gray-600 text-sm">المشاريع</p>
//             <p className="text-3xl font-bold">1560</p>
//           </div>
//         </div>

//         {/* التبويبات */}
//         <div className="border-b border-gray-200 flex gap-8">
//           <button onClick={() => setActiveTab('home')} className={`pb-4 font-semibold ${activeTab === 'home' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>
//             الرئيسية
//           </button>
//           <button onClick={() => setActiveTab('approvals')} className={`pb-4 font-semibold ${activeTab === 'approvals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>
//             الموافقات ({pendingApprovals.length})
//           </button>
//           <button onClick={() => setActiveTab('universities')} className={`pb-4 font-semibold ${activeTab === 'universities' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>
//             الجامعات
//           </button>
//         </div>

//         {/* محتوى التبويبات */}
//         <div className="mt-6">
//           {activeTab === 'approvals' && (
//             <div className="space-y-4">
//               {pendingApprovals.length > 0 ? (
//                 pendingApprovals.map((approval) => (
//                   <div key={approval.approval_id} className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
//                     <p className="font-bold">{approval.approval_type}</p>
//                     <p className="text-sm text-gray-600 mt-1">من: {approval.requested_by.name}</p>
//                     <div className="flex gap-2 mt-4">
//                       <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">موافقة</button>
//                       <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">رفض</button>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <p className="text-center text-gray-600 py-8">لا توجد موافقات معلقة</p>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default MinistryDashboard;
import React, { useState } from 'react';
import { useAuthStore, useApprovalsStore } from '../../store/useStore';
import Layout from '../../components/Layout';
import UniversityTable from '../../components/UniversityTable'; // <-- import your university page

const MinistryDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { pendingApprovals } = useApprovalsStore();
  const [activeTab, setActiveTab] = useState('home');

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">مرحباً، {user?.name}</h1>
          <p className="text-sm text-slate-400 mt-1">مسؤوليات: الإشراف الوطني، اعتماد الجامعات والكليات، تقارير وإحصاءات وطنية</p>
        </div>

        {/* بطاقات إحصائية */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border-r-4 border-yellow-500">
            <p className="text-gray-600 text-sm">موافقات معلقة</p>
            <p className="text-3xl font-bold">{pendingApprovals.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-r-4 border-blue-500">
            <p className="text-gray-600 text-sm">الجامعات</p>
            <p className="text-3xl font-bold">10</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-r-4 border-green-500">
            <p className="text-gray-600 text-sm">الكليات</p>
            <p className="text-3xl font-bold">80</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-r-4 border-purple-500">
            <p className="text-gray-600 text-sm">المشاريع</p>
            <p className="text-3xl font-bold">1560</p>
          </div>
        </div>

        {/* التبويبات */}
        <div className="border-b border-gray-200 flex gap-8">
          <button
            onClick={() => setActiveTab('home')}
            className={`pb-4 font-semibold ${activeTab === 'home' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
          >
            الرئيسية
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`pb-4 font-semibold ${activeTab === 'approvals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
          >
            الموافقات ({pendingApprovals.length})
          </button>
          <button
            onClick={() => setActiveTab('universities')}
            className={`pb-4 font-semibold ${activeTab === 'universities' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
          >
            الجامعات
          </button>
        </div>

        {/* محتوى التبويبات */}
        <div className="mt-6">
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map((approval) => (
                  <div key={approval.approval_id} className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                    <p className="font-bold">{approval.approval_type}</p>
                    <p className="text-sm text-gray-600 mt-1">من: {approval.requested_by.name}</p>
                    <div className="flex gap-2 mt-4">
                      <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">موافقة</button>
                      <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">رفض</button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 py-8">لا توجد موافقات معلقة</p>
              )}
            </div>
          )}

          {activeTab === 'universities' && (
            <UniversityTable />  // <-- render your university management page here
          )}

          {activeTab === 'home' && (
            <p className="text-gray-600 py-8">مرحباً بك في لوحة الوزارة</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MinistryDashboard;
