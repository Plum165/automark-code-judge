//Moegamat Samsodien
//19/04/2026
//Memory class that acts as memory in the OS for a simulator to allow us to get solutions.
import java.util.*;

class Memory {

    private final Integer[] frames;

    // Constructor: Initialize memory with the given number of frames
    public Memory(final int numFrames) {
        this.frames = new Integer[numFrames];
    }

    // Returns true if the specified frame is empty
    public boolean isEmpty(final int frameNumber) {
        return frames[frameNumber] == null;
    }

    // Returns the total number of frames
    public int size() {
        return frames.length;
    }

    // Gets the page number at the given frame
    public int get(final int frameNumber) {
        assert !this.isEmpty(frameNumber);
        return frames[frameNumber];
    }

    // Puts a page number into the specified frame
    public void put(final int frameNumber, final int pageNumber) {
        frames[frameNumber] = pageNumber;
    }

    // Replaces an existing page in memory with a new page
    public void replace(final int pageNumber, final int newNumber) {
        assert this.contains(pageNumber);
        this.put(this.indexOf(pageNumber), newNumber);
    }

    // Checks if a page is currently in memory
    public boolean contains(final int pageNumber) {
        return indexOf(pageNumber) != -1;
    }

    // Finds the index of the frame that contains the given page
    public int indexOf(final int pageNumber) {
        for (int i = 0; i < frames.length; i++) {
            if (!isEmpty(i) && frames[i] == pageNumber) {
                return i;
            }
        }
        return -1;
    }

    // Returns a string representation of the memory frames
    public String toString() {
        final StringBuilder stringBuilder = new StringBuilder();
        stringBuilder.append('[');

        if (this.size() > 0) {
            stringBuilder.append(this.toString(0));
            for (int i = 1; i < this.size(); i++) {
                stringBuilder.append(", ");
                stringBuilder.append(this.toString(i));
            }
        }

        stringBuilder.append(']');
        return stringBuilder.toString();
    }

    // Helper: returns "-" for empty frame, or the page number
    private String toString(final int index) {
        if (this.isEmpty(index)) {
            return "-";
        } else {
            return this.frames[index].toString();
        }
    }
}

class Solution {

    public static String execute(String input) {
        Scanner sc = new Scanner(input);

        int numFrames = sc.nextInt();
        String referenceString = sc.next();

        int faults = OPT_Algorithm.optimal(new Memory(numFrames), toArray(referenceString));

        return "Page faults: " + faults + ".";
    }

    private static Integer[] toArray(final String referenceString) {
        Integer[] result = new Integer[referenceString.length()];

        for (int i = 0; i < referenceString.length(); i++) {
            result[i] = Character.digit(referenceString.charAt(i), 10);
        }

        return result;
    }
}


public class OPT_Algorithm_tests {
    public static void main(String[] args) {
        String[] inputs = {
    "3 70120", "3 123412", "4 12345", "2 12123", "3 01010", 
    "3 701203", "4 012301", "2 5432", "3 111222", "3 12312"
};

String[] expected = {
    "Page faults: 4.",
    "Page faults: 4.",
    "Page faults: 5.",
    "Page faults: 2.",
    "Page faults: 5.",
    "Page faults: 5.",
    "Page faults: 4.",
    "Page faults: 4.",
    "Page faults: 2.",
    "Page faults: 3."
};
        for (int i = 0; i < inputs.length; i++) {
            try {
            System.out.println("TEST " + (i + 1) + ": Processing ");
                String result = Solution.execute(inputs[i]);
                

                if (result != null && result.trim().equals(expected[i].trim())) {
                    System.out.println("TEST " + (i + 1) + ": PASS");
                } else {
                    System.out.println("TEST " + (i + 1) + ": FAIL | Expected: "
                            + expected[i] + " Got: " + result);
                }
            } catch (Exception e) {
                System.out.println("TEST " + (i + 1) + ": FAIL | Runtime Error: " + e.getMessage());
            }
        }

        System.out.println("DONE");
    }

}
    