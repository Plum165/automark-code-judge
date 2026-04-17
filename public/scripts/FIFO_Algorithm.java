import java.util.Scanner;
import java.util.ArrayList;
import java.util.List;
//
public class FIFO {

public static int optimalPageReplacement(final Memory frames, final Integer[] pageReferences) {
    int pageFaults = 0;

    for (int i = 0; i < pageReferences.length; i++) {
        int page = pageReferences[i];

        // Page already in memory
        if (frames.contains(page)) continue;

        pageFaults++;

        // If there's empty space, use it
        boolean placed = false;
        for (int f = 0; f < frames.size(); f++) {
            if (frames.isEmpty(f)) {
                frames.put(f, page);
                placed = true;
                break;
            }
        }
        if (placed) continue;

        // Otherwise, choose the page to replace based on future usage
        int frameToReplace = -1;
        int farthestUse = -1;

        for (int f = 0; f < frames.size(); f++) {
            int currentPage = frames.get(f);
            int nextUse = Integer.MAX_VALUE;
            for (int j = i + 1; j < pageReferences.length; j++) {
                if (pageReferences[j] == currentPage) {
                    nextUse = j;
                    break;
                }
            }
            if (nextUse > farthestUse) {
                farthestUse = nextUse;
                frameToReplace = f;
            }
        }

        frames.put(frameToReplace, page);
    }

    return pageFaults;
}
public static int leastRecentlyUsed(final Memory frames, final Integer[] pageReferences) {
    int pageFaults = 0;
    List<Integer> recentHistory = new ArrayList<>();

    for (int page : pageReferences) {
        if (frames.contains(page)) {
            // Update LRU history
            recentHistory.remove((Integer) page);
            recentHistory.add(page);
            continue;
        }

        pageFaults++;
        

        // If there's an empty frame, use it
        boolean placed = false;
        for (int f = 0; f < frames.size(); f++) {
            if (frames.isEmpty(f)) {
                frames.put(f, page);
                recentHistory.add(page);
                placed = true;
                break;
            }
        }
        if (placed) continue;

        // Evict LRU page
        int lruPage = recentHistory.get(0);
        int lruIndex = frames.indexOf(lruPage);
        frames.put(lruIndex, page);

        recentHistory.remove(0);
        recentHistory.add(page);
        
    }

    return pageFaults;
}
    private static int firstInFirstOut(final Memory frames, final Integer[] pageReferences) {
        int pageFaults = 0;
        /**
         * Your code here.
         * 
         * Using the frames memory object, process the pageReferences using the FIFO paging algorithm, returning the number of page faults.
         */
         int frame = 0;
         
         for (int ref : pageReferences)
         {
            
            if (!(frames.contains(ref)))
            {
              if (frames.isEmpty(frame)){
               frames.put(frame,ref);}
               else {
               int currentPage = frames.get(frame); 
               frames.replace(currentPage,ref);
               }
               pageFaults++;
               frame = (frame +1) % frames.size();
               System.out.println(ref + ": " + frames);
            }
            else { System.out.println(ref + ": " + "-");}
            
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

        System.out.printf("Page faults: %d.\n", firstInFirstOut(new Memory(numFrames), toArray(referenceString)));
    }
//function to put referenceString
    private static Integer[] toArray(final String referenceString) {
        final Integer[] result = new Integer[referenceString.length()];
        
        for(int i=0; i < referenceString.length(); i++) {
        
            result[i] = Character.digit(referenceString.charAt(i), 10);
        }
        return result;
    }
}