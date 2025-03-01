# Sound Effects for Emoji Bubble Game

This directory contains sound effects used in the Emoji Bubble Game.

## Sound Files

- **pop.mp3**: Sound effect for popping regular emoji bubbles
- **explosion.mp3**: Sound effect for popping grenade bubbles
- **game_start.mp3**: Sound played when the game starts
- **game_over.mp3**: Sound played when the game ends
- **background_music.mp3**: Background music that plays during gameplay

## Credits

These sound effects are from [Mixkit](https://mixkit.co/free-sound-effects/) and are free to use.

## Implementation

The sounds are loaded and managed by the `useSoundEffects` hook in the `EmojiBubbleGame.js` file.

## Usage

To add more sound effects:
1. Add the sound file to this directory
2. Update the `sounds` object in the `useSoundEffects` hook
3. Call the `play` function with the sound name where needed

Example:
```javascript
// Add to sounds object
sounds.current.newSound = new Audio('/sounds/new_sound.mp3');

// Play the sound
soundEffects.play('newSound');
``` 