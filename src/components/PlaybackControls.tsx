import React from 'react';

import { Button, PlayerIcon, HtmlMouseEvent, MouseEventHandler } from 'react-player-controls';

const Rewind = (props:any) => (
    <svg viewBox="0 0 100 100" {...props}>
        <polygon points="46 86.3 4 48 46 12.6 46 86.3"></polygon>
        <polygon points="92 86.3 50 48 92 12.6 92 86.3"></polygon>
    </svg>
);

const FastForward = (props:any) => (
    <svg viewBox="0 0 100 100" {...props}>
        <polygon points="8 86.3 50 48 8 12.6 8 86.3"></polygon>
        <polygon points="54 86.3 96 48 54 12.6 54 86.3"></polygon>
    </svg>
);

interface PlaybackControlsProps {
  className: string;
  isPlaying: boolean;
  onPlaybackChange: (isPlaying:boolean) => void;
  hasPrevious: () => boolean;
  hasNext: () => boolean;
  onPrevious: MouseEventHandler;
  onNext: MouseEventHandler;
  onFastForward: MouseEventHandler;
  onRewind: MouseEventHandler;
}

const PlaybackControls : React.FC<PlaybackControlsProps> = ({ className, isPlaying, onPlaybackChange, hasPrevious, hasNext, onPrevious, onNext, onFastForward, onRewind }) => (
    <div className={className}>
        <Button
            isEnabled={hasPrevious() !== false}
            onClick={onRewind}>
            <Rewind />
        </Button>

        <Button
            isEnabled={hasPrevious() !== false}
            onClick={onPrevious}>
            <PlayerIcon.Previous />
        </Button>

        <Button
            isEnabled={hasNext() !== false}
            onClick={(event:HtmlMouseEvent) =>
                onPlaybackChange(isPlaying)
            }>
            {
                isPlaying ?
                    (<PlayerIcon.Pause />) : (<PlayerIcon.Play />)
            }
        </Button>

        <Button
            isEnabled={hasNext() !== false}
            onClick={onNext}>
              <PlayerIcon.Next />
        </Button>

        <Button
            isEnabled={hasNext() !== false}
            onClick={onFastForward}>
              <FastForward />
        </Button>
    </div>
);

export default PlaybackControls;
