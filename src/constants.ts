
export interface TestResult {
  id: number;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  testCases: number;
  starterCode: {
    java: string;
    python: string;
    r: string;
  };
  solution?: {
    java: string;
    python: string;
    r: string;
  };
}

export const PROBLEMS: Problem[] = [
  {
    id: 'linear_search',
    title: 'Linear Search',
    description: 'Write a function that searches for a target value in an array and returns its index. If not found, return -1.',
    testCases: 10,
    starterCode: {
      java: `public class Solution {
    public static int linearSearch(int[] arr, int target) {
        // Your code here
        return -1;
    }
}`,
      python: `def linear_search(arr, target):
    # Your code here
    pass`,
      r: `linear_search <- function(arr, target) {
  # Your code here
}`
    },
    solution: {
      java: `public class Solution {
    public static int linearSearch(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) return i;
        }
        return -1;
    }
}`,
      python: `def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1`,
      r: `linear_search <- function(arr, target) {
  for (i in 1:length(arr)) {
    if (arr[i] == target) return(i - 1) # Return 0-indexed for consistency
  }
  return(-1)
}`
    }
  },
  {
    id: 'binary_search',
    title: 'Binary Search',
    description: 'Write an efficient function to search for a target value in a sorted array using the Binary Search algorithm.',
    testCases: 10,
    starterCode: {
      java: `public class Solution {
    public static int binarySearch(int[] arr, int target) {
        // Your code here
        return -1;
    }
}`,
      python: `def binary_search(arr, target):
    # Your code here
    pass`,
      r: `binary_search <- function(arr, target) {
  # Your code here
}`
    }
  },
  {
    id: 'hello_world',
    title: 'Basic Output',
    description: 'Write a program that simply prints "Hello, Code Judge!" to the console.',
    testCases: 5,
    starterCode: {
      java: `public class Main {
    public static void main(String[] args) {
        // Your code here
    }
}`,
      python: `# Your code here`,
      r: `# Your code here`
    }
  }
];

export const THEMES = [
  { id: 'professional-polish', name: 'Professional Polish' },
  { id: 'cat-noir', name: 'Cat Noir' },
  { id: 'blood-red', name: 'Blood Red' },
  { id: 'cyberpunk-glow', name: 'Cyberpunk Glow' },
  { id: 'dark-emerald', name: 'Dark Emerald' },
  { id: 'sapphire-steel', name: 'Sapphire Steel' },
  { id: 'monochrome-focus', name: 'Monochrome Focus' },
  { id: 'spiderman', name: 'Spiderman' }
];

export type Language = 'java' | 'python' | 'r';
