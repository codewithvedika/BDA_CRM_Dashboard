import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, useDroppable, useDraggable
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { getKanbanLeads, updateKanbanPositions } from '../utils/api';
import toast from 'react-hot-toast';
import { FiUser, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';

const STAGE_COLORS = {
  'New Lead': 'border-t-blue-500',
  'Contacted': 'border-t-yellow-500',
  'Qualified': 'border-t-purple-500',
  'Proposal Sent': 'border-t-orange-500',
  'Negotiation': 'border-t-indigo-500',
  'Won': 'border-t-green-500',
  'Lost': 'border-t-red-500',
};

const BADGE_DOTS = {
  'New Lead': 'bg-blue-500',
  'Contacted': 'bg-yellow-500',
  'Qualified': 'bg-purple-500',
  'Proposal Sent': 'bg-orange-500',
  'Negotiation': 'bg-indigo-500',
  'Won': 'bg-green-500',
  'Lost': 'bg-red-500',
};

function LeadCard({ lead, isDragging }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead._id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 999, opacity: isDragging ? 0.5 : 1 } : {};

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
      className="card p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{lead.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{lead.company}</p>
        </div>
        <span className={`badge-${lead.priority.toLowerCase()} text-xs`}>{lead.priority}</span>
      </div>
      <div className="space-y-1.5">
        {lead.assignedTo && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <FiUser className="text-gray-400" />
            {lead.assignedTo.name}
          </div>
        )}
        {lead.expectedDealValue > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <FiDollarSign className="text-gray-400" />
            ₹{lead.expectedDealValue.toLocaleString()}
          </div>
        )}
        {lead.nextFollowUpDate && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <FiCalendar className="text-gray-400" />
            {format(new Date(lead.nextFollowUpDate), 'dd MMM')}
          </div>
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => navigate(`/leads/${lead._id}`)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          View Details →
        </button>
      </div>
    </div>
  );
}

function Column({ title, leads, activeId }) {
  const { setNodeRef, isOver } = useDroppable({ id: title });
  return (
    <div className={`flex-shrink-0 w-64 flex flex-col rounded-xl border-t-4 ${STAGE_COLORS[title]} bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 border-t-4`}>
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${BADGE_DOTS[title]}`} />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</span>
        </div>
        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full px-2 py-0.5 font-medium">
          {leads.length}
        </span>
      </div>
      <div ref={setNodeRef} className={`flex-1 p-2 space-y-2 min-h-32 rounded-b-xl transition-colors ${isOver ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
        <SortableContext items={leads.map(l => l._id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => <LeadCard key={lead._id} lead={lead} isDragging={activeId === lead._id} />)}
        </SortableContext>
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-xs text-gray-400">Drop here</p>
          </div>
        )}
      </div>
      {leads.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500">
            ₹{leads.reduce((s, l) => s + (l.expectedDealValue || 0), 0).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default function KanbanPage() {
  const [kanban, setKanban] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const STAGES = ['New Lead','Contacted','Qualified','Proposal Sent','Negotiation','Won','Lost'];

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    getKanbanLeads()
      .then(r => setKanban(r.data))
      .catch(() => toast.error('Failed to load kanban'))
      .finally(() => setLoading(false));
  }, []);

  const findLeadStage = (leadId) => STAGES.find(s => kanban[s]?.some(l => l._id === leadId));

  const handleDragStart = (e) => setActiveId(e.active.id);

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const fromStage = findLeadStage(active.id);
    const toStage = STAGES.includes(over.id) ? over.id : findLeadStage(over.id);
    if (!fromStage || !toStage || fromStage === toStage) return;

    const lead = kanban[fromStage].find(l => l._id === active.id);
    setKanban(prev => ({
      ...prev,
      [fromStage]: prev[fromStage].filter(l => l._id !== active.id),
      [toStage]: [{ ...lead, status: toStage }, ...prev[toStage]],
    }));

    try {
      await updateKanbanPositions({ updates: [{ id: active.id, status: toStage, position: 0 }] });
      toast.success(`Moved to ${toStage}`);
    } catch {
      toast.error('Failed to update');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  const activeCard = activeId ? Object.values(kanban).flat().find(l => l._id === activeId) : null;

  return (
    <div className="fade-in h-full">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline Board</h1>
        <p className="text-gray-500 text-sm mt-0.5">Drag and drop leads between stages</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6 kanban-scroll">
          {STAGES.map(stage => (
            <Column key={stage} title={stage} leads={kanban[stage] || []} activeId={activeId} />
          ))}
        </div>
        <DragOverlay>
          {activeCard && (
            <div className="card p-3 shadow-2xl w-64 rotate-2 opacity-95">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{activeCard.name}</p>
              <p className="text-xs text-gray-500">{activeCard.company}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
