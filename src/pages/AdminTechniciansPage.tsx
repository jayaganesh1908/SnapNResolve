import React, { useCallback, useEffect, useState } from 'react';
import { Phone, Plus, UserPlus } from 'lucide-react';
import { CategoryIcon, getCategoryIconColor } from '../components/CategoryIcon';
import { useToast } from '../contexts/ToastContext';
import * as api from '../services/api';
import { ApiError } from '../services/api';
import { Category, Technician } from '../types';
import { CATEGORIES } from '../utils/format';

export default function AdminTechniciansPage() {
  const { showToast } = useToast();

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Record<number, boolean>>({});

  // Add technician form
  const [name, setName] = useState('');
  const [department, setDepartment] = useState<Category>('Electrical');
  const [phone, setPhone] = useState('');
  const [adding, setAdding] = useState(false);

  const loadTechnicians = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.listTechnicians();
      setTechnicians(list);
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : 'Unable to load technicians.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTechnicians();
  }, [loadTechnicians]);

  async function handleToggleActive(tech: Technician) {
    if (togglingIds[tech.id]) return;
    setTogglingIds((prev) => ({ ...prev, [tech.id]: true }));
    try {
      const updated = await api.setTechnicianActive(tech.id, !tech.is_active);
      setTechnicians((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      showToast(
        `${updated.name} marked ${updated.is_active ? 'active' : 'inactive'}`,
        'info'
      );
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : 'Unable to update technician status.',
        'error'
      );
    } finally {
      setTogglingIds((prev) => ({ ...prev, [tech.id]: false }));
    }
  }

  async function handleAddTechnician(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      showToast('Please enter the technician name.', 'error');
      return;
    }

    setAdding(true);
    try {
      const created = await api.addTechnician({
        name: name.trim(),
        department,
        phone: phone.trim() || null,
      });
      setTechnicians((prev) => [...prev, created]);
      setName('');
      setPhone('');
      setDepartment('Electrical');
      showToast(`Added ${created.name} (${created.department})`, 'success');
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : 'Unable to add technician.',
        'error'
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Technicians
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Manage campus maintenance staff, active duty status, and current open workload.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Technician List */}
        <div className="lg:col-span-8 space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-16 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : technicians.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                No technicians registered yet. Add one using the form.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
              {technicians.map((tech) => {
                const busy = Boolean(togglingIds[tech.id]);
                return (
                  <div
                    key={tech.id}
                    className="p-4 sm:px-5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          tech.is_active
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <CategoryIcon category={tech.department} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2
                            className={`text-sm sm:text-base font-semibold truncate ${
                              tech.is_active ? 'text-slate-900' : 'text-slate-400 line-through'
                            }`}
                          >
                            {tech.name}
                          </h2>
                          {!tech.is_active && (
                            <span className="text-[11px] font-medium text-slate-500">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                          <span className={`font-medium ${getCategoryIconColor(tech.department)}`}>
                            {tech.department}
                          </span>
                          {tech.phone && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {tech.phone}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900 font-mono tabular-nums leading-none">
                          {tech.open_tickets}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 whitespace-nowrap">
                          open {tech.open_tickets === 1 ? 'ticket' : 'tickets'}
                        </p>
                      </div>

                      {/* Accessible Active Switch (>= 44px tap hitbox) */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={tech.is_active}
                        aria-label={`Set ${tech.name} ${tech.is_active ? 'inactive' : 'active'}`}
                        disabled={busy}
                        onClick={() => handleToggleActive(tech)}
                        className="min-h-[44px] min-w-[52px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-xl disabled:opacity-60"
                      >
                        <span
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            tech.is_active ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                              tech.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Technician Form */}
        <div className="lg:col-span-4">
          <form
            onSubmit={handleAddTechnician}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                Add New Technician
              </h2>
            </div>

            <div>
              <label
                htmlFor="tech-name"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Full name
              </label>
              <input
                id="tech-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Suresh Babu"
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label
                htmlFor="tech-dept"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Department
              </label>
              <select
                id="tech-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value as Category)}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tech-phone"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Phone number <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="tech-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9000000006"
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={adding}
              className="w-full min-h-[48px] px-4 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {adding ? 'Adding...' : 'Add Technician'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
