# Channel Action Logic Documentation

## Overview
The channel system allows players to move energy tokens between chakra rows using 8 different channel patterns. Each channel has specific movement rules, and some channels offer choices between different move sequences.

## Channel Patterns (from material.inc.php)

```php
$this->channels = array(
    1 => array(array(3)),              // Move 1 energy down 3 rows
    2 => array(array(1,1,1)),          // Move 3 different energies down 1 row each
    3 => array(array(2,1), array(1,2)), // Choice: down 2+1 OR down 1+2
    4 => array(array(-2)),             // Move 1 energy up 2 rows
    5 => array(array(-1,-1)),          // Move 2 different energies up 1 row each
    6 => array(array(-1,1), array(1,-1)), // Choice: down-up OR up-down
    7 => array(array(1), array(-1)),   // Choice: down 1 OR up 1
    8 => array()                        // Special: discard black energy, pick new color
);
```

**Key:**
- Positive numbers = move DOWN (toward earth/row 9)
- Negative numbers = move UP (toward universe/row 1)
- Multiple values in array = multi-step sequence
- Multiple arrays = player chooses one variant

## State Flow

### 1. Channel Selection
**State:** `take`
**Action:** Player clicks channel icon → calls `actChannel(id)`
**Backend:**
- Validates channel is available
- Moves inspiration token to channel location
- Sets global state: `channel=id`, `step=0`, `choice=0`, `alreadyMoved=0`
- Transitions to `channel` state

### 2. Energy Selection Loop
**State:** `channel`
**Argument Function:** `argChannel()` determines selectable energies

#### For each step in the channel sequence:

**Step 0 (first move):**
- Show ALL possible first moves across ALL choice variants
- Example: Channel 3 shows energies that can move down 2 OR down 1
- Player selection locks in the `choice` variant

**Step 1+ (subsequent moves):**
- Only show moves for the locked `choice` variant
- Skip energies already moved (tracked in `alreadyMoved`)
- Skip energies in harmonized rows

**Move Validation:**
For each energy, `argChannel()` checks:
1. **Not in harmonized row** - Can't move from completed chakras
2. **Not already moved** - Each energy moves once per sequence
3. **Movement is valid** - Validates destination row:
   - Must land in valid row (1-9)
   - Skips over harmonized rows (adds to movement distance)
   - Row 2-8 must have space (<3 energies) unless moving to row 9
   - Black/white energies can go to row 9 (earth)
4. **Won't block future steps** - Calls `isNextStepPossible()` to ensure remaining moves are possible

**Player Action:**
- Clicks energy → calls `actMove(energyId, row)`
- Backend updates database, increments `step`, records `alreadyMoved`
- Returns to `channel` state for next step OR sets `undo=1` if complete

### 3. Confirmation
**State:** `channel` with `undo=1`
**Actions:**
- **Confirm Button** → `actConfirm()` → proceeds to `next` state
- **Cancel Button** → `actUndo()` → reverts all moves, returns to `take` state

**Alternative at Step 0:**
- **Cancel Button** → `actCancel()` → returns inspiration token, goes to `take` state

## Key Functions

### `argChannel()` - Determines Selectable Energies

**Input:** Current game state (channel, step, choice, alreadyMoved)
**Output:** `possibles` array mapping energy IDs to valid destination rows

```php
$ret['possibles'][$energyId][$choiceVariant] = $destinationRow;
```

**Logic Flow:**
```
FOR each energy on player board:
    IF energy.row is harmonized → SKIP
    IF energy.id in alreadyMoved → SKIP
    IF energy.row == 9 (earth) → SKIP
    
    FOR each choice variant (or locked choice if step > 0):
        diff = channels[channel][variant][step]
        
        Calculate destination row accounting for harmonized skips
        IF move is valid AND isNextStepPossible():
            possibles[energyId][variant] = destinationRow
```

**Special Handling:**
- **Harmonized Rows:** Movement SKIPS over harmonized rows
  - Example: Moving down 2 from row 5, if row 6 is harmonized, lands on row 8
- **Row Capacity:** Rows 2-8 must have <3 energies to receive (unless black/white to row 9)
- **Lookahead:** `isNextStepPossible()` simulates future steps to prevent dead-ends

### `isNextStepPossible()` - Validates Future Moves

**Purpose:** Ensures selecting this energy won't make the remaining sequence impossible

**Input:**
- `channel`: Which channel pattern
- `stepCurrent`: Current step number
- `choice`: Locked variant choice
- `alreadyMoved`: Encoded list of moved energy IDs
- `table`: Current board state (energy positions)

**Logic:**
```
FOR each remaining step in channels[channel][choice]:
    FOR each unmoved energy:
        IF this energy can make this move:
            Create temporary table with move applied
            Continue to next step
    
    IF no energy can make this step:
        RETURN false (would block sequence)

RETURN true (sequence is completable)
```

**Complexity:** This recursive lookahead can check multiple future steps, creating O(n^m) complexity where n=energies, m=remaining steps.

### `actMove()` - Execute Energy Move

**Input:** `energyId`, `row`
**Validation:** Checks if move is in `argChannel()` possibles

**Actions:**
1. Update energy position in database
2. Check for harmonization (3 matching colors)
   - If harmonized, return inspiration token, add point
3. Determine which choice variant was selected (by matching `row`)
4. Update state:
   - `alreadyMoved = alreadyMoved * 100 + energyId` (encodes as base-100)
   - `step++`
   - `choice = variant` (locks for future steps)
5. Return to `channel` state
   - `argChannel()` will set `undo=1` if all steps complete

## Encoding Scheme

### `alreadyMoved` - Tracks Moved Energy IDs
**Encoding:** Base-100 concatenation
```php
// Example: Moved energies 42, 17, 9
$alreadyMoved = 42 * 100*100 + 17 * 100 + 9 = 421709

// Decoding:
while($am > 0) {
    $alreadyMoved[] = $am % 100;  // Extract rightmost 2 digits
    $am = floor($am / 100);        // Shift right
}
// Result: [9, 17, 42]
```

**Limitation:** Energy IDs must be < 100 (reasonable for BGA)

## Client-Side Behavior (undochakra.js)

### Visual Feedback
- **Selectable energies:** Yellow/blue pulsing animation
- **Selected energy:** Color-specific glow effect
- **During moves:** No buttons shown (step > 0 && undo == 0)
- **After completion:** Confirm + Cancel buttons (undo == 1)

### State Tracking
```javascript
this.channelStep = 0;   // Current step number (from argChannel)
this.channelUndo = 0;   // 1 if all moves complete, 0 otherwise
this.possibles = {};    // Map of selectable energies from argChannel
this.selectedEnergyId = null; // Currently selected energy
```

### Button Display Logic
```javascript
if(args.undo == 1) {
    // All moves complete - show Confirm + Cancel
    addButton('confirm_button', 'onConfirmChannel');
    addButton('cancel_button', 'onCancelChannel');
} else if(args.step == 0) {
    // At start - show Cancel only
    addButton('cancel_button', 'onCancelChannel');
}
// During intermediate steps: no buttons
```

### Energy Selection
1. Player clicks selectable energy
2. If only 1 destination → auto-execute `actMove()`
3. If multiple destinations → mark energy selected, show destination placeholders
4. Player clicks destination placeholder → execute `actMove()`

## Edge Cases & Validation

### 1. All Rows Harmonized
- No energies are selectable (all rows skipped)
- Channel becomes unavailable in `isChannelPossible()`

### 2. Insufficient Space
- If target row has 3 energies, move is invalid
- Exception: Black/white can always go to row 9 (earth has 8 slots)

### 3. Dead-End Prevention
- `isNextStepPossible()` prevents selecting moves that block future steps
- Example: Channel 2 (move 3 energies down 1)
  - If row 6 only has 2 free spaces, can't select 3rd energy for row 5→6

### 4. Harmonization During Sequence
- If a move harmonizes a row during the sequence, that row becomes skippable for future moves
- The `isNextStepPossible()` validation accounts for this

### 5. Browser Refresh During Channel
- State persists in database (channel, step, choice, alreadyMoved)
- Player can continue from current step
- `argChannel()` recalculates valid moves based on current state

## Performance Considerations

### Bottlenecks
1. **`isNextStepPossible()` recursion** - O(n^m) where n=energies, m=steps
   - Worst case: Channel 2 (3 steps) with 24 energies = 13,824 checks
2. **`argChannel()` loops** - Checks every energy × every variant × lookahead
3. **Database queries** - Multiple queries per `argChannel()` call

### Optimizations Present
- Early exit when energy is in harmonized row
- Skip already-moved energies
- Cache harmonized status in array
- Use `tableCopy()` for simulations vs database queries

### Potential Improvements
- **Memoization:** Cache `isNextStepPossible()` results for identical states
- **Pruning:** If choice is locked (step > 0), don't check other variants
- **Batch queries:** Combine multiple `isHarmonized()` checks into single query

## Simplifications Implemented (Option C)

### What Was Removed
1. **pendingAction system for take/meditate** - Actions now execute immediately
2. **Meditation warnings** - No longer block with confirmation prompts
3. **Undo mid-sequence** - Can only cancel at start or undo all at end
4. **Multiple button types** - Reduced from 5 buttons to 2 (confirm/cancel)

### What Remains
1. **Multi-step channel flow** - Essential to game mechanics
2. **Choice variant system** - Channels 3, 6, 7 still offer choices
3. **Lookahead validation** - Prevents impossible sequences
4. **Harmonization skip logic** - Core movement rule

### User Experience Impact
- **Faster gameplay** - No confirmations for routine actions
- **Clearer flow** - Buttons only at decision points (start/end)
- **Less frustrating** - Can't get stuck mid-sequence with wrong button
- **More streamlined** - Take/meditate actions are immediate

## Testing Checklist

- [ ] Channel 1: Single 3-step move
- [ ] Channel 2: Three 1-step moves (test alreadyMoved tracking)
- [ ] Channel 3: Choice between 2+1 and 1+2 sequences
- [ ] Channel 4-7: Up movements and choice variants
- [ ] Channel 8: Special black energy discard
- [ ] Harmonization during channel sequence
- [ ] Cancel at step 0
- [ ] Cancel at completion (undo all)
- [ ] Browser refresh mid-sequence
- [ ] Insufficient space scenarios
- [ ] All rows harmonized scenario
