import java.util.ArrayList;
import java.util.List;

public class LRU_Algorithm {
     // Least Recently Used (LRU) Page Replacement
    private static int leastRecentlyUsed(final Memory frames, final Integer[] pageReferences) {
        System.out.println("Least Recently Used (LRU)");
        int pageFaults = 0;
        List<Integer> recentHistory = new ArrayList<>(); // Tracks usage order

        for (int page : pageReferences) {
            if (frames.contains(page)) {
                // Move page to the end (most recently used)
                recentHistory.remove((Integer) page);
                recentHistory.add(page);
                System.out.println(page + ": " + "-");
                continue;
            }

            pageFaults++;

            boolean placed = false;
            for (int f = 0; f < frames.size(); f++) {
                if (frames.isEmpty(f)) {
                    frames.put(f, page);
                    recentHistory.add(page);
                    placed = true;
                    System.out.println(page + ": " + frames);
                    break;
                }
            }
            if (placed) continue;

            // Replace least recently used page
            int lruPage = recentHistory.get(0);
            int lruIndex = frames.indexOf(lruPage);
            frames.put(lruIndex, page);

            recentHistory.remove(0);
            recentHistory.add(page);
            System.out.println(page + ": " + frames);
        }

        return pageFaults;
    }


      public static void main(final String[] args) {
        final Scanner stdIn = new Scanner(System.in);

        System.out.println("Enter the physical memory size (number of frames):");
        final int numFrames = stdIn.nextInt();
        stdIn.nextLine();

        System.out.println("Enter the string of page references:");
        final String referenceString = stdIn.nextLine();

        System.out.printf("Page faults: %d.\n", leastRecentlyUsed(new Memory(numFrames), toArray(referenceString)));
    }

    private static Integer[] toArray(final String referenceString) {
        final Integer[] result = new Integer[referenceString.length()];
        
        for(int i=0; i < referenceString.length(); i++) {
            result[i] = Character.digit(referenceString.charAt(i), 10);
        }
        return result;
    }


}