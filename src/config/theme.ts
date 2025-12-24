export interface OrnamentTheme {
    name: string;
    background: string;
    heading: {
        gradient: string[];
        shadow: string;
        glow: string;
    };
    tree: {
        foliage: string[];
        ornamentGlow: string;
        garland: string;
        iceLight: string;
        star: {
            main: string;
            glow: string;
            emissive: string;
        };
    };
    snow: {
        color1: string;
        color2: string;
        emissive: string;
    };
    photo: {
        frame: string;
        back: string;
        text: string;
    };
    gift: {
        box: string;
        ribbon: string;
    };
    colors: {
        primaryBall: string;
        secondaryBall: string;
        lights: string;
        candy: string;
    };
}

export const Themes: Record<string, OrnamentTheme> = {
    Classic: {
        name: 'Classic',
        background: '#001a13',
        heading: {
            gradient: ['#FFD700', '#FFA500', '#FF6347'],
            shadow: 'rgba(255, 215, 0, 0.5)',
            glow: 'rgba(255, 215, 0, 0.3)',
        },
        tree: {
            foliage: ['#ffffff', '#e0f7fa', '#f8bbd0'],
            ornamentGlow: '#FFD700',
            garland: '#ffffcc',
            iceLight: '#e0f7fa',
            star: {
                main: '#FFFACD',
                glow: '#FFE680',
                emissive: '#FFD700',
            },
        },
        snow: {
            color1: '#FFD700',
            color2: '#C0C0C0',
            emissive: '#ffffff',
        },
        photo: {
            frame: '#ffdddd',
            back: '#ffdddd',
            text: 'black',
        },
        gift: {
            box: 'hsla(317, 100%, 94%, 1.00)',
            ribbon: '#dc143c',
        },
        colors: {
            primaryBall: '#ff3333', // Red
            secondaryBall: '#FFD700', // Gold
            lights: '#ffffcc',
            candy: '#ff0000',
        },
    },
    Dreamy: {
        name: 'Dreamy',
        background: '#1a001a',
        heading: {
            gradient: ['#FFB7C5', '#FF69B4', '#DA70D6'],
            shadow: 'rgba(255, 183, 197, 0.5)',
            glow: 'rgba(255, 183, 197, 0.3)',
        },
        tree: {
            foliage: ['#ffffff', '#fce4ec', '#f8bbd0'],
            ornamentGlow: '#FFB7C5',
            garland: '#fff0f5',
            iceLight: '#fce4ec',
            star: {
                main: '#ffffff',
                glow: '#FFB7C5',
                emissive: '#FF69B4',
            },
        },
        snow: {
            color1: '#FFB7C5',
            color2: '#C0C0C0',
            emissive: '#ffffff',
        },
        photo: {
            frame: '#ffffff',
            back: '#fce4ec',
            text: '#880e4f',
        },
        gift: {
            box: '#FFB7C5', // Pink
            ribbon: '#C0C0C0', // Silver
        },
        colors: {
            primaryBall: '#FFB7C5', // Pink
            secondaryBall: '#C0C0C0', // Silver
            lights: '#ffffcc',
            candy: '#ff00ff',
        },
    },
};

export const currentTheme = Themes.Classic;
