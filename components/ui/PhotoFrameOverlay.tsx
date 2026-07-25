import React from 'react';
import photoFrames from '../../public/photo-frames.json';

interface PhotoFrameOverlayProps {
  frameId?: string;
  borderColor?: string;
  borderWidth?: number;
}

export function PhotoFrameOverlay({
  frameId = 'classic_circle',
  borderColor = '#ffffff',
  borderWidth = 2,
}: PhotoFrameOverlayProps) {
  const clipId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const maskId = `mask-${clipId}`;

  const matchedFrame = (photoFrames as any[]).find((f: any) => f.id === frameId);
  
  let matched = matchedFrame;
  if (!matched) {
    if (frameId === 'circle' || frameId === 'circular' || frameId === 'classic_circle') {
      matched = { clipPathType: 'circle', clipPathProps: { cx: 50, cy: 50, r: 45 }, shapes: [{ type: 'circle', cx: 50, cy: 50, r: 45, fill: 'none', stroke: 'borderColor', strokeWidth: 'borderWidth' }], preserveAspectRatio: true };
    } else if (frameId === 'hexagon') {
      matched = { clipPathType: 'polygon', clipPathProps: { points: "50,5 90,28 90,72 50,95 10,72 10,28" }, shapes: [{ type: 'polygon', points: "50,5 90,28 90,72 50,95 10,72 10,28", fill: 'none', stroke: 'borderColor', strokeWidth: 'borderWidth' }], preserveAspectRatio: true };
    } else if (frameId === 'diamond') {
      matched = { clipPathType: 'polygon', clipPathProps: { points: "50,5 95,50 50,95 5,50" }, shapes: [{ type: 'polygon', points: "50,5 95,50 50,95 5,50", fill: 'none', stroke: 'borderColor', strokeWidth: 'borderWidth' }], preserveAspectRatio: true };
    } else if (frameId === 'shield') {
      matched = { clipPathType: 'polygon', clipPathProps: { points: "50,0 100,15 100,50 50,100 0,50 0,15" }, shapes: [{ type: 'polygon', points: "50,0 100,15 100,50 50,100 0,50 0,15", fill: 'none', stroke: 'borderColor', strokeWidth: 'borderWidth' }], preserveAspectRatio: true };
    } else {
      matched = { clipPathType: 'rect', clipPathProps: { x: 5, y: 5, width: 90, height: 90, rx: 8 }, shapes: [{ type: 'rect', x: 5, y: 5, width: 90, height: 90, rx: 8, fill: 'none', stroke: 'borderColor', strokeWidth: 'borderWidth' }] };
    }
  }

  const renderClipShape = (fill: string) => {
    if (matched.clipPathType === 'circle') {
      return <circle {...matched.clipPathProps} fill={fill} />;
    } else if (matched.clipPathType === 'polygon') {
      return <polygon {...matched.clipPathProps} fill={fill} />;
    } else if (matched.clipPathType === 'path') {
      return <path {...matched.clipPathProps} fill={fill} />;
    } else {
      return <rect {...matched.clipPathProps} fill={fill} />;
    }
  };

  const renderShapes = () => {
    if (!matched.shapes) return null;
    return matched.shapes.map((s: any, idx: number) => {
      const resolvedProps = { ...s };
      if (resolvedProps.stroke === 'borderColor') resolvedProps.stroke = borderColor;
      if (resolvedProps.strokeWidth === 'borderWidth') resolvedProps.strokeWidth = borderWidth;
      
      // Clean up specific string keywords that could cause issues
      Object.keys(resolvedProps).forEach(key => {
        if (resolvedProps[key] === 'borderColor') resolvedProps[key] = borderColor;
        if (resolvedProps[key] === 'accentColor') resolvedProps[key] = '#3b82f6';
        if (resolvedProps[key] === 'secondaryColor') resolvedProps[key] = '#60a5fa';
        if (resolvedProps[key] === 'borderWidth') resolvedProps[key] = borderWidth;
      });

      if (s.type === 'circle') return <circle key={idx} {...resolvedProps} fill="none" />;
      if (s.type === 'polygon') return <polygon key={idx} {...resolvedProps} fill="none" />;
      if (s.type === 'path') return <path key={idx} {...resolvedProps} fill="none" />;
      if (s.type === 'rect') return <rect key={idx} {...resolvedProps} fill="none" />;
      return null;
    });
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio={matched.preserveAspectRatio ? 'xMidYMid meet' : 'none'}
        className="w-full h-full"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="100" height="100" fill="white" />
            {renderClipShape("black")}
          </mask>
        </defs>

        {/* The dark overlay outside the frame */}
        <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.65)" mask={`url(#${maskId})`} />
        
        {/* The guide lines/border for the frame itself */}
        {renderShapes()}
        
        {/* Center Crosshair for face alignment (Subtle) */}
        <g stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" strokeDasharray="2 2">
          <line x1="50" y1="35" x2="50" y2="65" />
          <line x1="35" y1="50" x2="65" y2="50" />
        </g>
      </svg>
    </div>
  );
}
