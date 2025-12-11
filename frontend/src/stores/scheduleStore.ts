import { create } from 'zustand';
import type { Schedule, Application } from '../types';

interface ScheduleState {
  schedules: Schedule[];
  selectedDate: Date;
  selectedSchedules: Schedule[];
  myApplications: Application[];
  appliedDates: string[];
  isLoading: boolean;

  setSchedules: (schedules: Schedule[]) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedSchedules: (schedules: Schedule[]) => void;
  setMyApplications: (applications: Application[]) => void;
  setAppliedDates: (dates: string[]) => void;
  setLoading: (loading: boolean) => void;
  addApplication: (application: Application) => void;
  removeApplication: (scheduleId: number) => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  selectedDate: new Date(),
  selectedSchedules: [],
  myApplications: [],
  appliedDates: [],
  isLoading: false,

  setSchedules: (schedules) => set({ schedules }),

  setSelectedDate: (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const schedules = get().schedules.filter(
      (s) => s.date === dateStr
    );
    set({ selectedDate: date, selectedSchedules: schedules });
  },

  setSelectedSchedules: (schedules) => set({ selectedSchedules: schedules }),

  setMyApplications: (applications) => {
    const dates = applications
      .filter((a) => a.status === 'applied' && a.schedule)
      .map((a) => a.schedule!.date);
    set({ myApplications: applications, appliedDates: [...new Set(dates)] });
  },

  setAppliedDates: (dates) => set({ appliedDates: dates }),

  setLoading: (loading) => set({ isLoading: loading }),

  addApplication: (application) => {
    const current = get().myApplications;
    const dates = get().appliedDates;
    if (application.schedule) {
      set({
        myApplications: [...current, application],
        appliedDates: [...new Set([...dates, application.schedule.date])],
      });
    }
  },

  removeApplication: (scheduleId) => {
    const current = get().myApplications;
    const updated = current.map((a) =>
      a.scheduleId === scheduleId
        ? { ...a, status: 'cancelled' as const, cancelledAt: new Date().toISOString() }
        : a
    );
    const dates = updated
      .filter((a) => a.status === 'applied' && a.schedule)
      .map((a) => a.schedule!.date);
    set({
      myApplications: updated,
      appliedDates: [...new Set(dates)],
    });
  },
}));
