/**
 * Live TV Page
 * ============
 * Live TV channel browser with category sidebar
 * and channel grid/list views.
 */

import React from 'react';
import { ChannelBrowser } from '../components/channels';

// ============================================
// Main Live TV Page Component
// ============================================

const LiveTVPage: React.FC = () => {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChannelBrowser />
    </div>
  );
};

export default LiveTVPage;
