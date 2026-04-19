export type Language = 'java' | 'python' | 'r';

export interface Problem {
  id: string;
  title: string;
  description: string;
  testCases: number;
  starterCode: { [key in Language]: string };
}

export const THEMES = [
  { id: 'professional-polish', name: 'Professional Polish' },
  { id: 'cat-noir', name: 'Cat Noir' },
  { id: 'blood-red', name: 'Blood Red' },
  { id: 'cyberpunk-glow', name: 'Cyberpunk Glow' },
  { id: 'spiderman', name: 'Spiderman' },
  { id: 'dark-emerald', name: 'Dark Emerald' }
];

export const SUPPORT_LIBRARY: Record<string, string> = {
  'os_memory': `
class Memory {
    private final Integer[] frames;
    public Memory(final int numFrames) { this.frames = new Integer[numFrames]; }
    public boolean isEmpty(final int frameNumber) { return frames[frameNumber] == null; }
    public int size() { return frames.length; }
    public int get(final int frameNumber) { return frames[frameNumber]; }
    public void put(final int frameNumber, final int pageNumber) { frames[frameNumber] = pageNumber; }
    public void replace(final int pageNumber, final int newNumber) { this.put(this.indexOf(pageNumber), newNumber); }
    public boolean contains(final int pageNumber) { return indexOf(pageNumber) != -1; }
    public int indexOf(final int pageNumber) {
        for (int i = 0; i < frames.length; i++) {
            if (!isEmpty(i) && frames[i] == pageNumber) return i;
        }
        return -1;
    }
    public String toString() {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < frames.length; i++) {
            sb.append(isEmpty(i) ? "-" : frames[i]);
            if (i < frames.length - 1) sb.append(", ");
        }
        return sb.append("]").toString();
    }
}`,

  'binary_tree': `
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int x) { val = x; }
}`,

  'none': ``
};