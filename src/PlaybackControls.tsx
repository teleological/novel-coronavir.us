import React from 'react';

import { Button, PlayerIcon, HtmlMouseEvent, MouseEventHandler } from 'react-player-controls';

class Rewind extends React.Component {
    render() {
        return (
            <svg viewBox="0 0 100 100" {...this.props}>
                <polygon points="46 86.3 4 48 46 12.6 46 86.3"></polygon>
                <polygon points="92 86.3 50 48 92 12.6 92 86.3"></polygon>
            </svg>
        );
    }
}

class FastForward extends React.Component {
    render() {
        return (
            <svg viewBox="0 0 100 100" {...this.props}>
                <polygon points="8 86.3 50 48 8 12.6 8 86.3"></polygon>
                <polygon points="54 86.3 96 48 54 12.6 54 86.3"></polygon>
            </svg>
        );
    }
}

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

class PlaybackControls extends React.Component<PlaybackControlsProps> {

	render() {
		return (
			<div className={this.props.className}>
				<Button
					isEnabled={this.props.hasPrevious() !== false}
					onClick={this.props.onRewind}>
					<Rewind />
				</Button>

				<Button
					isEnabled={this.props.hasPrevious() !== false}
					onClick={this.props.onPrevious}>
					<PlayerIcon.Previous />
				</Button>

				<Button
					isEnabled={this.props.hasNext() !== false}
					onClick={(event:HtmlMouseEvent) =>
						this.props.onPlaybackChange(this.props.isPlaying)
					}>
					{
						this.props.isPlaying ?
							(<PlayerIcon.Pause />) : (<PlayerIcon.Play />)
					}
				</Button>

				<Button
					isEnabled={this.props.hasNext() !== false}
					onClick={this.props.onNext}>
					  <PlayerIcon.Next />
				</Button>

				<Button
					isEnabled={this.props.hasNext() !== false}
					onClick={this.props.onFastForward}>
					  <FastForward />
				</Button>
			</div>
		);
	}
}

export default PlaybackControls;
