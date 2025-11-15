#!/usr/bin/env node
/* eslint-disable no-console */
import { analyzeSentiment, warmupSentiment } from './services/sentiment.js';

/**
 * Simple CLI utility to test Xenova sentiment analysis
 *
 * Usage:
 *   npm run test:sentiment "Your text here"
 *   npm run test:sentiment
 */

const testSamples = [
  'This product is absolutely amazing! Best purchase ever!',
  'Terrible experience, completely disappointed.',
  'It works as expected, nothing special.',
  'I love this! Highly recommend to everyone.',
  "Worst product I've ever bought. Save your money.",
  'Pretty decent, meets basic requirements.',
  'ok'
];

async function main() {
  console.log('🚀 Warming up Xenova sentiment analysis model...\n');
  const warmupStart = Date.now();
  await warmupSentiment();
  const warmupTime = Date.now() - warmupStart;
  console.log(`✅ Model loaded in ${warmupTime}ms\n`);
  console.log('─'.repeat(80));

  // Get text from command line args or use test samples
  const inputText = process.argv.slice(2).join(' ');
  const textsToAnalyze = inputText ? [inputText] : testSamples;

  for (const text of textsToAnalyze) {
    console.log(`\n📝 Text: "${text}"\n`);

    const start = Date.now();
    const result = await analyzeSentiment(text);
    const duration = Date.now() - start;

    // Format output
    console.log(`   Label: ${getLabelEmoji(result.label)} ${result.label}`);
    console.log(`   Score: ${result.score} (range: -10 to +10)`);
    console.log(`   Time:  ${duration}ms`);
    console.log('\n   Probabilities:');
    console.log(`     Positive: ${(result.probs.positive * 100).toFixed(2)}%`);
    console.log(`     Neutral:  ${(result.probs.neutral * 100).toFixed(2)}%`);
    console.log(`     Negative: ${(result.probs.negative * 100).toFixed(2)}%`);
    console.log('\n' + '─'.repeat(80));
  }

  console.log('\n✨ Analysis complete!\n');
}

function getLabelEmoji(label: string): string {
  switch (label) {
    case 'Good':
      return '😊';
    case 'Bad':
      return '😞';
    case 'Neutral':
      return '😐';
    default:
      return '❓';
  }
}

// Run the CLI
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
