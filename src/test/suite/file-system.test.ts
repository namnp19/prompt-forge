import * as assert from 'node:assert'
import { describe, it } from 'mocha'
import { looksBinary } from '../../utils/file-system'

describe('looksBinary', () => {
	// ── Text files that must NOT be classified as binary ─────────────────────

	it('returns false for pure ASCII text', () => {
		const buf = Buffer.from('Hello, world! This is plain ASCII text.\n', 'utf8')
		assert.strictEqual(looksBinary(buf), false)
	})

	it('returns false for Vietnamese UTF-8 text', () => {
		// "à", "ế", "ờ", "ộ"... each encodes to 2-3 bytes > 127
		const buf = Buffer.from(
			'Xin chào, thế giới! Đây là văn bản tiếng Việt.\n',
			'utf8',
		)
		assert.strictEqual(looksBinary(buf), false)
	})

	it('returns false for Chinese UTF-8 text', () => {
		// CJK ideographs: each is 3 bytes > 127
		const buf = Buffer.from('你好，世界！这是中文文本。\n', 'utf8')
		assert.strictEqual(looksBinary(buf), false)
	})

	it('returns false for Japanese UTF-8 text', () => {
		const buf = Buffer.from(
			'こんにちは世界！これは日本語のテキストです。\n',
			'utf8',
		)
		assert.strictEqual(looksBinary(buf), false)
	})

	it('returns false for Arabic UTF-8 text', () => {
		const buf = Buffer.from('مرحبا بالعالم! هذا نص عربي.\n', 'utf8')
		assert.strictEqual(looksBinary(buf), false)
	})

	it('returns false for emoji-rich text', () => {
		const buf = Buffer.from('Hello 🌍! I love 🍣 and 🎉 emojis! 🚀\n', 'utf8')
		assert.strictEqual(looksBinary(buf), false)
	})

	it('returns false for mixed Vietnamese + code (realistic source file)', () => {
		const src = `// Tính tổng hai số nguyên
function tinhTong(a: number, b: number): number {
  // Trả về kết quả
  return a + b
}
`
		assert.strictEqual(looksBinary(Buffer.from(src, 'utf8')), false)
	})

	it('returns false for empty chunk', () => {
		assert.strictEqual(looksBinary(new Uint8Array(0)), false)
	})

	// ── Binary files that MUST be classified as binary ────────────────────────

	it('returns true for ELF magic bytes', () => {
		// 0x7F 'E' 'L' 'F'
		const buf = new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00])
		assert.strictEqual(looksBinary(buf), true)
	})

	it('returns true for PNG magic bytes', () => {
		const buf = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
		assert.strictEqual(looksBinary(buf), true)
	})

	it('returns true for JPEG magic bytes', () => {
		const buf = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
		assert.strictEqual(looksBinary(buf), true)
	})

	it('returns true for PDF magic bytes', () => {
		const buf = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // %PDF
		assert.strictEqual(looksBinary(buf), true)
	})

	it('returns true for buffer containing null bytes', () => {
		// A mix of ASCII + null byte → binary
		const buf = Buffer.from('some text\x00more text', 'binary')
		assert.strictEqual(looksBinary(buf), true)
	})

	it('returns true for buffer with many null bytes (e.g., padding in binary file)', () => {
		const buf = new Uint8Array(100).fill(0)
		assert.strictEqual(looksBinary(buf), true)
	})

	// ── Boundary / edge cases ─────────────────────────────────────────────────

	it('returns false for chunk with incomplete UTF-8 sequence at the end (boundary trim)', () => {
		// Build a valid Vietnamese string, then take a raw slice that cuts a multi-byte
		// sequence. The fix should trim trailing bytes and still succeed.
		const full = Buffer.from('Xin chào thế giới', 'utf8')
		// Deliberately cut 1 byte off the end (likely mid-sequence for the last char)
		const partial = full.subarray(0, full.length - 1)
		// This should NOT be classified as binary — it's text with an incomplete tail
		assert.strictEqual(looksBinary(partial), false)
	})

	it('returns false for Latin-1 encoded text (non-UTF-8 text fallback)', () => {
		// Latin-1: bytes in 0x80-0xFF but no null bytes and very few control chars
		// These are valid Latin-1 characters (not valid UTF-8), but still text.
		const latin1 = Buffer.from('Héllo Wörld — café résumé naïve\n', 'latin1')
		assert.strictEqual(looksBinary(latin1), false)
	})
})
