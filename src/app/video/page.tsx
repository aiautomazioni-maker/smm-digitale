import VideoProjectInitiator from '@/components/video/VideoProjectInitiator';
import VideoTimelineEditor from '@/components/video/VideoTimelineEditor';
import CoverSelector from '@/components/video/CoverSelector';
import PrePublishScore from '@/components/video/PrePublishScore';
import { Video } from 'lucide-react';

export default function VideoStudioPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Video className="w-8 h-8 text-blue-500" />
                        Video Studio
                    </h1>
                    <p className="text-white/60 mt-1">
                        Create, edit, and schedule vertical video content for Reels, TikTok, and Shorts.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Initiation / Project Context */}
                <div className="space-y-6">
                    <VideoProjectInitiator />
                </div>

                {/* Right Column: Video Editor / Timeline */}
                <div className="space-y-6">
                    <VideoTimelineEditor />
                    <CoverSelector />
                    <PrePublishScore />
                </div>
            </div>
        </div>
    );
}
