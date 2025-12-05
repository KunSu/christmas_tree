export interface OrnamentTheme {
    name: string;
    colors: {
        primaryBall: string;
        secondaryBall: string;
        primaryGift: string;
        secondaryGift: string;
        lights: string;
        candy: string;
    };
}

export const Themes: Record<string, OrnamentTheme> = {
    Classic: {
        name: 'Classic',
        colors: {
            primaryBall: '#ff3333', // Red
            secondaryBall: '#FFD700', // Gold
            primaryGift: '#ff3333', // Red
            secondaryGift: '#FFD700', // Gold
            lights: '#ffffcc',
            candy: '#ff0000',
        },
    },
    Dreamy: {
        name: 'Dreamy',
        colors: {
            primaryBall: '#FFB7C5', // Pink
            secondaryBall: '#C0C0C0', // Silver
            primaryGift: '#FFB7C5', // Pink
            secondaryGift: '#C0C0C0', // Silver
            lights: '#ffffcc',
            candy: '#ff00ff',
        },
    },
};

export const currentTheme = Themes.Classic;
