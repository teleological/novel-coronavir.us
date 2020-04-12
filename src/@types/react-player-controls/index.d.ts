declare module "react-player-controls" {
    import React from 'react';

    export type HtmlMouseEvent = MouseEvent<HTMLElement>;
    export type MouseEventHandler =
        (event:HtmlMouseEvent) => boolean | void;

    interface ButtonProps {
        onClick: MouseEventHandler;
        isEnabled?: boolean;
        className?: string | null;
        style?: React.CSSProperties;
        children: React.ReactNode;
    }

    export enum Direction {
        HORIZONTAL = 'HORIZONTAL',
        VERTICAL = 'VERTICAL'
    }

    interface FormattedTimeProps {
        numSeconds?: number;
        className?: string | null;
        style: React.CSSProperties;
    }

    interface SliderProps {
        direction?: Direction;
        isEnabled?: boolean;
        onIntent?: (intent?:number) => void;
        onIntentStart?: (intent?:number) => void;
        onIntentEnd?: () => void;
        onChange?: (value?:number) => void;
        onChangeStart?: (value?:number) => void;
        onChangeEnd?: (value?:number) => void;
        children: React.ReactNode;
        className?: string | null;
        style: React.CSSProperties;
        overlayZIndex?: number;
    }

    export namespace PlayerIcon {
        export class Pause extends React.Component { }
        export class Play extends React.Component { }
        export class Previous extends React.Component { }
        export class Next extends React.Component { }
        export class SoundOn extends React.Component { }
        export class SoundOff extends React.Component { }
    }

    export class Slider extends React.Component<SliderProps> { }
    export class FormattedTime extends React.Component<FormattedTimeProps> { }
    export class Button extends React.Component<ButtonProps> {}
}
