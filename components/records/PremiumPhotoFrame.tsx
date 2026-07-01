import React from 'react';
import photoFrames from '../../public/photo-frames.json';

interface PremiumPhotoFrameProps {
  frameStyle?: string;
  width: number;
  height: number;
  imageUrl?: string;
  borderColor?: string;
  accentColor?: string;
  secondaryColor?: string;
  shadowColor?: string;
  opacity?: number;
  cropScale?: number;
  cropX?: number;
  cropY?: number;
  isDesignerMode?: boolean;
  borderWidth?: number;
  imageFit?: 'cover' | 'contain';
  frameAsset?: string;
  padding?: number;
  backgroundColor?: string;
  borderRadius?: number;
  frame?: {
    id: string;
    asset: string;
    name?: string;
  };
}

export default function PremiumPhotoFrame({
  frameStyle = 'classic_circle',
  width,
  height,
  imageUrl,
  borderColor = '#3b82f6',
  accentColor = '#93c5fd',
  secondaryColor = '#facc15',
  shadowColor = '#000000',
  opacity = 1,
  cropScale = 1,
  cropX = 0,
  cropY = 0,
  isDesignerMode = false,
  borderWidth = 3,
  imageFit = 'cover',
  frameAsset,
  padding = 0,
  backgroundColor,
  borderRadius = 8,
  frame,
}: PremiumPhotoFrameProps) {
  const clipId = React.useId().replace(/[^a-zA-Z0-9]/g, '');

  const photoX = 0;
  const photoY = 0;
  const photoW = 100;
  const photoH = 100;

  const renderProfilePlaceholder = () => (
    <g>
      <rect width="100" height="100" fill="#f1f5f9" />
      <path
        d="M50,44 C57.5,44 63.5,38 63.5,30.5 C63.5,23 57.5,17 50,17 C42.5,17 36.5,23 36.5,30.5 C36.5,38 42.5,44 50,44 Z M50,51 C37.5,51 17,57.5 17,70 L17,83 L83,83 L83,70 C83,57.5 62.5,51 50,51 Z"
        fill="#cbd5e1"
      />
    </g>
  );

  const imageElement = imageUrl ? (
    <image
      href={imageUrl}
      x={photoX}
      y={photoY}
      width={photoW}
      height={photoH}
      preserveAspectRatio={imageFit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}
      clipPath={`url(#clip-${clipId})`}
      style={{
        transform: `scale(${cropScale}) translate(${cropX}%, ${cropY}%)`,
        transformOrigin: 'center center',
      }}
    />
  ) : (
    <g clipPath={`url(#clip-${clipId})`}>
      {renderProfilePlaceholder()}
    </g>
  );

  const finalFrameId = frame?.id || frameStyle;
  const matchedFrame = photoFrames.find((f: any) => f.id === finalFrameId);
  const finalFrameAsset = matchedFrame?.frameAsset || frame?.asset || frameAsset || (frameStyle && (frameStyle.includes('/') || frameStyle.includes('.')) ? frameStyle : undefined);

  const renderFrameContent = () => {
    const matched = (matchedFrame || {
      clipPathType: 'rect',
      clipPathProps: { x: 5, y: 5, width: 90, height: 90, rx: borderRadius, ry: borderRadius },
      shapes: [
        {
          type: 'rect',
          x: 5,
          y: 5,
          width: 90,
          height: 90,
          rx: borderRadius,
          ry: borderRadius,
          fill: 'none',
          stroke: 'borderColor',
          strokeWidth: 'borderWidth'
        }
      ]
    }) as any;

    const clipType = matched.clipPathType || 'rect';
    const clipProps = (matched.clipPathProps || { x: 5, y: 5, width: 90, height: 90, rx: borderRadius, ry: borderRadius }) as any;

    const resolvePropValue = (val: any) => {
      if (val === 'borderColor') return borderColor;
      if (val === 'accentColor') return accentColor;
      if (val === 'secondaryColor') return secondaryColor;
      if (val === 'borderWidth') return borderWidth;
      if (val === 'url(#grad)') return `url(#grad-${clipId})`;
      return val;
    };

    return (
      <>
        <defs>
          <clipPath id={`clip-${clipId}`}>
            {clipType === 'circle' ? (
              <circle
                cx={resolvePropValue(clipProps.cx ?? 50)}
                cy={resolvePropValue(clipProps.cy ?? 50)}
                r={resolvePropValue(clipProps.r ?? 45)}
              />
            ) : clipType === 'polygon' ? (
              <polygon points={clipProps.points} />
            ) : (
              <rect
                x={resolvePropValue(clipProps.x ?? 5)}
                y={resolvePropValue(clipProps.y ?? 5)}
                width={resolvePropValue(clipProps.width ?? 90)}
                height={resolvePropValue(clipProps.height ?? 90)}
                rx={resolvePropValue(clipProps.rx ?? borderRadius)}
                ry={resolvePropValue(clipProps.ry ?? borderRadius)}
              />
            )}
          </clipPath>
          <linearGradient id={`grad-${clipId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>
        </defs>

        {backgroundColor && (
          clipType === 'circle' ? (
            <circle
              cx={resolvePropValue(clipProps.cx ?? 50)}
              cy={resolvePropValue(clipProps.cy ?? 50)}
              r={resolvePropValue(clipProps.r ?? 45)}
              fill={backgroundColor}
            />
          ) : clipType === 'polygon' ? (
            <polygon points={clipProps.points} fill={backgroundColor} />
          ) : (
            <rect
              x={resolvePropValue(clipProps.x ?? 5)}
              y={resolvePropValue(clipProps.y ?? 5)}
              width={resolvePropValue(clipProps.width ?? 90)}
              height={resolvePropValue(clipProps.height ?? 90)}
              rx={resolvePropValue(clipProps.rx ?? borderRadius)}
              ry={resolvePropValue(clipProps.ry ?? borderRadius)}
              fill={backgroundColor}
            />
          )
        )}

        {imageElement}

        {Array.isArray(matched.shapes) &&
          matched.shapes.map((s: any, idx: number) => {
            const resolvedProps: Record<string, any> = {};
            Object.keys(s).forEach((k) => {
              if (k !== 'type') {
                resolvedProps[k] = resolvePropValue(s[k]);
              }
            });

            if (s.type === 'circle') {
              return (
                <circle
                  key={idx}
                  cx={resolvedProps.cx ?? 50}
                  cy={resolvedProps.cy ?? 50}
                  r={resolvedProps.r ?? 45}
                  {...resolvedProps}
                />
              );
            }
            if (s.type === 'polygon') {
              return <polygon key={idx} {...resolvedProps} />;
            }
            if (s.type === 'path') {
              return <path key={idx} {...resolvedProps} />;
            }
            return (
              <rect
                key={idx}
                x={resolvedProps.x ?? 5}
                y={resolvedProps.y ?? 5}
                width={resolvedProps.width ?? 90}
                height={resolvedProps.height ?? 90}
                {...resolvedProps}
              />
            );
          })}

        {finalFrameAsset && (
          <image
            href={finalFrameAsset}
            x="0"
            y="0"
            width="100"
            height="100"
            preserveAspectRatio="none"
          />
        )}
      </>
    );
  };

  return (
    <div
      style={{
        width,
        height,
        opacity,
      }}
      className="relative select-none pointer-events-none w-full h-full"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        style={{
          filter: shadowColor ? `drop-shadow(0px 3px 8px ${shadowColor}40)` : undefined,
        }}
      >
        {renderFrameContent()}
      </svg>
    </div>
  );
}
