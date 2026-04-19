//Moegamat Samsodien
//SMSMOE006
//20 May 2025

import java.util.Arrays;
import java.util.List;
import java.util.Scanner;

public class ClockSecondChance_Algorithm {
// Clock Second-Chance Algorithm
    public static int clockSecondChance(final Memory frames, final Integer[] pageReferences) {
      //  System.out.println("Clock Second Chance");
        int pageFaults = 0;
        int clockHand = 0; // Pointer for clock rotation
        Integer[] ref = new Integer[frames.size()]; // Reference bits

        for (int i = 0; i < frames.size(); i++) ref[i] = 0;

        for (int page : pageReferences) {
            if (frames.contains(page)) {
                ref[frames.indexOf(page)] = 1;
                System.out.println(page + ": -");
                continue;
            }

            pageFaults++;

            while (true) {
                if (frames.isEmpty(clockHand)) {
                    frames.put(clockHand, page);
                    ref[frames.indexOf(page)] = 1;
                    clockHand = (clockHand + 1) % frames.size();
                    break;
                } else if (ref[clockHand] == 0) {
                    ref[clockHand] = 1;
                    frames.put(clockHand, page);
                    clockHand = (clockHand + 1) % frames.size();
                    break;
                } else {
                    ref[clockHand] = 0;
                    clockHand = (clockHand + 1) % frames.size();
                }
            }
            
            System.out.println(page + ": " + frames);
        }

        return pageFaults;
    }
    
     // Helper: Converts Integer array to string for display
    public static String print(Integer[] arr) {
        return Arrays.toString(arr);
    }

    public static void main(final String[] args) {
        final Scanner stdIn = new Scanner(System.in);

        System.out.println("Enter the physical memory size (number of frames):");
        final int numFrames = stdIn.nextInt();
        stdIn.nextLine();

        System.out.println("Enter the string of page references:");
        final String referenceString = stdIn.nextLine();

        System.out.printf("Page faults: %d.\n", clockSecondChance( new Memory(numFrames), toArray(referenceString)));
    }

    public static Integer[] toArray(final String referenceString) {
        final Integer[] result = new Integer[referenceString.length()];
        
        for(int i=0; i < referenceString.length(); i++) {
            result[i] = Character.digit(referenceString.charAt(i), 10);
        }
        return result;
    }

}