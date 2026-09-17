import { SmileysAndEmotions } from "./Emoji";

export interface AnimatedEmojiMetadata {
  emoji: string;
  order: number;
  category: string;
  source: string;
  provider: string;
  animated: boolean;
}

export const EmojiAnimation: AnimatedEmojiMetadata[] = SmileysAndEmotions.map((emoji, index) => ({
  emoji,
  order: index + 1,
  category: "Smileys and emotions",
  source: "https://googlefonts.github.io/noto-emoji-animation/",
  provider: "Noto Emoji Animation",
  animated: true,
}));

export default EmojiAnimation;
