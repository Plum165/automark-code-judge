//Moegamat Samsodien
//SMSMOE006
//20 May 2025

import java.util.Arrays;
import java.util.List;
import java.util.Scanner;

public class OPT_Algorithm {

    
    public static int optimal(final Memory frames, final Integer[] pageReferences) {
            int pageFaults = 0;

    for (int i = 0; i < pageReferences.length; i++) {
        int page = pageReferences[i];

        if (frames.contains(page)) 
        {
        System.out.println(page + ": " +"-" );
        continue;
         
        }

        pageFaults++;
        //increase
        //if empty
        //if replace


        boolean added = false;
        for (int f = 0; f < frames.size(); f++) {
            if (frames.isEmpty(f)) { // check if frames are empty
                frames.put(f, page);
                added = true;
                System.out.println(page + ": " +frames);
                break;
            }
        }
        if (added) continue;

 
        int frameToReplace = -1;
        int furthest = -1;

        for (int f = 0; f < frames.size(); f++) {
            int currentPage = frames.get(f);
            int nextUse = Integer.MAX_VALUE;
            for (int j = i + 1; j < pageReferences.length; j++) {
                if (pageReferences[j] == currentPage) {
                    nextUse = j;
                    break;
                }
            }
            if (nextUse > furthest) {  //finds the largest value in future
                furthest = nextUse;
                frameToReplace = f;
            }
        }

        frames.put(frameToReplace, page);
        System.out.println(page + ": " +frames);
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

        System.out.printf("Page faults: %d.\n", optimal(new Memory(numFrames), toArray(referenceString)));
    }

    private static Integer[] toArray(final String referenceString) {
        final Integer[] result = new Integer[referenceString.length()];
        
        for(int i=0; i < referenceString.length(); i++) {
            result[i] = Character.digit(referenceString.charAt(i), 10);
        }
        return result;
    }
}