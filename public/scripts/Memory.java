//Moegamat Samsodien
//21/06/2025
//Memory class that acts as memory in the OS for a simulator.
import java.util.List;
import java.util.ArrayList;

public class Memory {

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
