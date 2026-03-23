import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import { generateRestAPI } from '../helpers/helpers';
import { getData } from '../services/commonService';

type DelayPerTaskPoint = { x: string; maxDelay: number; minDelay: number };

type TasksState = {
  loading: boolean;
  error?: string | null;
  labels: string[];
  maxDelay: number[];
  minDelay: number[];
};

const initialState: TasksState = {
  loading: false,
  error: null,
  labels: [],
  maxDelay: [],
  minDelay: [],
};

export const tasks = createModel<RootModel>()({
  state: initialState,
  reducers: {
    setLoading(state, loading: boolean) {
      return { ...state, loading, error: null };
    },
    setError(state, error?: string | null) {
      return { ...state, loading: false, error };
    },
    setGraph(state, payload: { labels: string[]; maxDelay: number[]; minDelay: number[] }) {
      return { ...state, loading: false, error: null, ...payload };
    },
    clear(state) {
      return { ...initialState };
    },
  },
  effects: () => ({
    async getDelayPerTaskAsync(
      params: {
        startdate: string;
        enddate: string;
        vin?: string;
        fleet_id?: string | number;
        organisation_id?: string | number;
        type?: 'vehicle' | 'driver';
      }
    ) {
      this.setLoading(true);

      // Build URL with your existing helper so it’s consistent with the app.
      // NOTE: REACT_APP_DELAY_PER_TASK must point to YOUR BACKEND route (not the third-party URL).
      const payload = generateRestAPI(
        [
          { fleet_id: params.fleet_id ?? 'All Fleets' },
          { organisation_id: params.organisation_id ?? 2 },
          { vin: params.vin ?? 'All Vins' },
          { startdate: params.startdate },
          { enddate: params.enddate },
          params.type ? { type: params.type } : {},
        ],
        process.env.REACT_APP_DELAY_PER_TASK
      );

      try {
        const res: { data?: DelayPerTaskPoint[] } | any = await getData(payload, 'delay-per-task');

        const points: DelayPerTaskPoint[] = Array.isArray(res?.data) ? res.data : res; // handle either {data:[]} or []
        const labels = (points || []).map(p => p.x);
        const maxDelay = (points || []).map(p => Number(p.maxDelay ?? 0));
        const minDelay = (points || []).map(p => Number(p.minDelay ?? 0));

        this.setGraph({ labels, maxDelay, minDelay });
        return { labels, maxDelay, minDelay };
      } catch (e: any) {
        this.setError(e?.message || 'Failed to fetch delay-per-task');
        return null;
      }
    },
  }),
});
