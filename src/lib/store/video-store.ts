import { create } from 'zustand';

export type VideoSourceMode = 'ai_generate' | 'edit_upload' | 'template' | 'mixed';

export interface VideoSpecs {
    aspect_ratio: string;
    width: number;
    height: number;
    fps: number;
    duration_sec: number;
    max_duration_sec: number;
    safe_zone: { top_px: number; bottom_px: number };
}

export interface VideoProjectContext {
    workspace_id: string;
    project_title: string;
    goal: string;
    concept: string;
    style_keywords: string[];
    platform_targets: string[];
    specs: VideoSpecs;
}

export interface FullVideoPlan {
    video_project: VideoProjectContext;
    script: any;
    storyboard: any;
    generation_plan: any;
    editor_edl: any;
    copy: any;
    cover_options: any[];
    publish_jobs: any[];
    warnings: string[];
}

interface VideoProjectState {
    isInitializing: boolean;
    projectManifest: VideoProjectContext | null; // Keep for backwards compatibility or initial view
    fullPlan: FullVideoPlan | null;
    missingInfo: string[];
    warnings: string[];

    setInitializing: (val: boolean) => void;
    setProjectManifest: (manifest: VideoProjectContext, missing?: string[], warnings?: string[]) => void;
    setFullPlan: (plan: FullVideoPlan, missing?: string[]) => void;
    applyPartialEdit: (editData: any) => void;
    clearProject: () => void;
}

export const useVideoStore = create<VideoProjectState>((set) => ({
    isInitializing: false,
    projectManifest: null,
    fullPlan: null,
    missingInfo: [],
    warnings: [],

    setInitializing: (val: boolean) => set({ isInitializing: val }),

    setProjectManifest: (manifest: VideoProjectContext, missing: string[] = [], warnings: string[] = []) =>
        set({
            projectManifest: manifest,
            missingInfo: missing,
            warnings: warnings,
            isInitializing: false
        }),

    setFullPlan: (plan: FullVideoPlan, missing: string[] = []) =>
        set({
            fullPlan: plan,
            projectManifest: plan.video_project, // sync the manifest
            missingInfo: missing,
            warnings: plan.warnings || [],
            isInitializing: false
        }),

    applyPartialEdit: (editData: any) =>
        set((state) => {
            if (!state.fullPlan) return state;
            const newPlan = { ...state.fullPlan };
            if (editData.updated_editor_edl) newPlan.editor_edl = editData.updated_editor_edl;
            if (editData.updated_copy) newPlan.copy = editData.updated_copy;
            if (editData.cover_options) newPlan.cover_options = editData.cover_options;
            if (editData.warnings) newPlan.warnings = [...(newPlan.warnings || []), ...editData.warnings];
            return { fullPlan: newPlan };
        }),

    clearProject: () =>
        set({
            projectManifest: null,
            fullPlan: null,
            missingInfo: [],
            warnings: [],
            isInitializing: false
        })
}));
