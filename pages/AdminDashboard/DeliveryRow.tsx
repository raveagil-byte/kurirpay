
import React from 'react';
import { Delivery, DeliveryStatus, User } from '../../types.ts';

interface DeliveryRowProps {
  delivery: Delivery;
  courier?: User;
  onUpdateStatus: (d: Delivery, s: DeliveryStatus) => void;
  onPrint: (d: Delivery) => void;
}

export const DeliveryRow: React.FC<DeliveryRowProps> = ({ delivery: d, courier, onUpdateStatus, onPrint }) => (
  <tr className="hover:bg-slate-50 transition-colors">
    <td className="px-6 py-4 text-xs font-medium text-slate-600">
      {new Date(d.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
    </td>
    <td className="px-6 py-4">
      <p className="font-bold text-slate-900 text-sm">{courier?.name || 'Unknown'}</p>
      <p className="text-[10px] text-slate-400 font-mono">ID: {d.id.toUpperCase()}</p>
    </td>
    <td className="px-6 py-4 text-center font-black text-slate-900">{d.itemCount}</td>
    <td className="px-6 py-4">
      <p className="text-sm font-bold text-indigo-600">Rp {d.totalAmount.toLocaleString('id-ID')}</p>
    </td>
    <td className="px-6 py-4 text-center">
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
        d.status === DeliveryStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-100' :
        d.status === DeliveryStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-100' : 
        'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
      }`}>
        {d.status}
      </span>
    </td>
    <td className="px-6 py-4 text-right no-print">
      <div className="flex flex-col items-end gap-2">
        {d.status === DeliveryStatus.PENDING ? (
          <div className="flex justify-end gap-2">
            <button onClick={() => onUpdateStatus(d, DeliveryStatus.APPROVED)} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter">Setujui</button>
            <button onClick={() => onUpdateStatus(d, DeliveryStatus.REJECTED)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter">Tolak</button>
          </div>
        ) : (
          <button 
            onClick={() => onPrint(d)}
            className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            Cetak
          </button>
        )}
      </div>
    </td>
  </tr>
);
