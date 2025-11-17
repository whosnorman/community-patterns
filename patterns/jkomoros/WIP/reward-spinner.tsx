/// <cts-enable />
import { Cell, computed, Default, handler, NAME, recipe, str, UI } from "commontools";

/**
 * Reward Spinner Pattern
 *
 * A fun spinner for kids with adjustable odds for each prize.
 * Prizes: 3 jelly beans, 1 jelly bean, or a hug
 *
 * The weights can be adjusted to change the likelihood of each prize
 * without changing the UI or behavior.
 */

const prizeOptions = [
  { emoji: "🍬🍬🍬", label: "Three Jelly Beans!" },
  { emoji: "🍬", label: "One Jelly Bean!" },
  { emoji: "🤗", label: "Big Hug!" },
] as const;

interface SpinRecord {
  timestamp: number;
  generosity: number;
  result: string;
}

interface SpinnerInput {
  currentEmoji: Cell<Default<string, "🎁">>;
  isSpinning: Cell<Default<boolean, false>>;
  // Generosity level: 0 = lots of candy (5% hugs), 10 = mostly hugs (99%)
  generosity: Cell<Default<number, 0>>;
  // Sequence of emojis for slot machine animation
  spinSequence: Cell<Default<string[], []>>;
  // Counter to force animation restart
  spinCount: Cell<Default<number, 0>>;
  // Show payout visualization
  showPayouts: Cell<Default<boolean, false>>;
  // History of all spins (timestamp, generosity level, result)
  spinHistory: Cell<Default<SpinRecord[], []>>;
}

interface SpinnerOutput {
  currentEmoji: Cell<Default<string, "🎁">>;
  isSpinning: Cell<Default<boolean, false>>;
  generosity: Cell<Default<number, 0>>;
  spinSequence: Cell<Default<string[], []>>;
  spinCount: Cell<Default<number, 0>>;
  showPayouts: Cell<Default<boolean, false>>;
  spinHistory: Cell<Default<SpinRecord[], []>>;
}

const spin = handler<
  unknown,
  {
    currentEmoji: Cell<string>;
    isSpinning: Cell<boolean>;
    generosity: Cell<number>;
    spinSequence: Cell<string[]>;
    spinCount: Cell<number>;
    spinHistory: Cell<SpinRecord[]>;
  }
>(
  (_, { currentEmoji, isSpinning, generosity, spinSequence, spinCount, spinHistory }) => {
    // Convert generosity (0-10) to weights
    // At 0: mostly hugs (99%), At 10: mostly candy (99%)
    const gen = generosity.get();
    const hugWeight = 11 - gen; // 11 to 1 (high gen = few hugs)
    const candyWeight = 1 + (gen * 10); // 1 to 101 (high gen = lots of candy)

    // Split candy between 3 beans and 1 bean
    const weightThreeBeans = candyWeight * 0.45;
    const weightOneBean = candyWeight * 0.55;

    const weights = [weightThreeBeans, weightOneBean, hugWeight];

    // Calculate total weight
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Pick a random number between 0 and totalWeight to determine final result
    const random = Math.random() * totalWeight;

    // Find which prize was selected
    let cumulativeWeight = 0;
    let selectedIndex = 0;

    for (let i = 0; i < weights.length; i++) {
      cumulativeWeight += weights[i];
      if (random < cumulativeWeight) {
        selectedIndex = i;
        break;
      }
    }

    const finalEmoji = prizeOptions[selectedIndex].emoji;

    // Update the final emoji first
    currentEmoji.set(finalEmoji);

    // Build slot machine sequence: random items, then final result at the end
    // Total of 15 items, with final result at position 14 (will be visible after animation)
    const sequence: string[] = [];
    for (let i = 0; i < 15; i++) {
      if (i === 14) {
        // Final result at the last position
        sequence.push(finalEmoji);
      } else {
        // Random prize
        const randomPrize = prizeOptions[Math.floor(Math.random() * prizeOptions.length)];
        sequence.push(randomPrize.emoji);
      }
    }

    // Set the sequence to trigger animation
    spinSequence.set(sequence);
    spinCount.set(spinCount.get() + 1);

    // Record this spin in history
    const history = spinHistory.get();
    const newRecord: SpinRecord = {
      timestamp: Date.now(),
      generosity: gen,
      result: finalEmoji,
    };
    spinHistory.set([...history, newRecord]);
  }
);

const decrementGenerosity = handler<
  unknown,
  { generosity: Cell<number>; showPayouts: Cell<boolean> }
>(
  (_, { generosity, showPayouts }) => {
    const current = generosity.get();
    if (current > 0) {
      generosity.set(current - 1);
      showPayouts.set(true);
      setTimeout(() => showPayouts.set(false), 2000);
    }
  }
);

const incrementGenerosity = handler<
  unknown,
  { generosity: Cell<number>; showPayouts: Cell<boolean> }
>(
  (_, { generosity, showPayouts }) => {
    const current = generosity.get();
    if (current < 10) {
      generosity.set(current + 1);
      showPayouts.set(true);
      setTimeout(() => showPayouts.set(false), 2000);
    }
  }
);

const closePayouts = handler<
  unknown,
  { showPayouts: Cell<boolean> }
>(
  (_, { showPayouts }) => {
    showPayouts.set(false);
  }
);

export default recipe<SpinnerInput, SpinnerOutput>(
  "Reward Spinner",
  ({ currentEmoji, isSpinning, generosity, spinSequence, spinCount, showPayouts, spinHistory }) => {
    // Compute the TADA emoji display from generosity level (0-10 emojis, one per level)
    const tadaDisplay = computed(() =>
      "🎉".repeat(generosity.get())
    );

    // Compute whether buttons should be disabled
    const minusDisabled = computed(() => generosity.get() <= 0);
    const plusDisabled = computed(() => generosity.get() >= 10);

    // Check if spinCount is even or odd to alternate animations
    const isEvenSpin = computed(() => spinCount.get() % 2 === 0);

    // Check if currently spinning (for sparkles)
    const showSparkles = computed(() => spinSequence.get().length > 0);

    // Calculate payout percentages
    const payoutPercentages = computed(() => {
      const gen = generosity.get();
      const hugWeight = 11 - gen;
      const candyWeight = 1 + (gen * 10);
      const weightThreeBeans = candyWeight * 0.45;
      const weightOneBean = candyWeight * 0.55;
      const totalWeight = weightThreeBeans + weightOneBean + hugWeight;

      return [
        { emoji: "🍬🍬🍬", percent: (weightThreeBeans / totalWeight) * 100 },
        { emoji: "🍬", percent: (weightOneBean / totalWeight) * 100 },
        { emoji: "🤗", percent: (hugWeight / totalWeight) * 100 },
      ];
    });

    // Check if current emoji is three candies (for special rendering)
    const isThreeCandies = computed(() => currentEmoji.get() === "🍬🍬🍬");

    return {
      [NAME]: str`Reward Spinner`,
      [UI]: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            backgroundColor: "#f0f9ff",
            fontFamily: "system-ui, sans-serif",
            padding: "20px",
            gap: "40px",
          }}
        >
          {/* Slot Machine Display */}
          <div
            style={{
              width: "min(300px, 90vw)",
              height: "200px",
              overflow: "hidden",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
            }}
          >
            {showSparkles ? (
              isEvenSpin ? (
                // Animated sequence (even spins)
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    animation: "slotSpin1 6s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    animationFillMode: "forwards",
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                  }}
                >
                  {spinSequence.map((emoji, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: "150px",
                        lineHeight: "200px",
                        height: "200px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        flexShrink: "0",
                        position: "relative",
                      }}
                    >
                      {emoji === "🍬🍬🍬" ? (
                        <>
                          {/* Left candy - behind and up-left */}
                          <span style={{
                            position: "absolute",
                            fontSize: "150px",
                            left: "calc(50% - 60px)",
                            top: "calc(50% - 15px)",
                            transform: "translate(-50%, -50%)",
                            zIndex: 1,
                          }}>🍬</span>
                          {/* Right candy - behind and up-right */}
                          <span style={{
                            position: "absolute",
                            fontSize: "150px",
                            left: "calc(50% + 60px)",
                            top: "calc(50% - 15px)",
                            transform: "translate(-50%, -50%)",
                            zIndex: 1,
                          }}>🍬</span>
                          {/* Middle candy - in front, centered */}
                          <span style={{
                            position: "absolute",
                            fontSize: "150px",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            zIndex: 2,
                          }}>🍬</span>
                        </>
                      ) : (
                        <span style={{
                          position: "absolute",
                          fontSize: "150px",
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                        }}>{emoji}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Animated sequence (odd spins)
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    animation: "slotSpin2 6s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    animationFillMode: "forwards",
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                  }}
                >
                  {spinSequence.map((emoji, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: "150px",
                        lineHeight: "200px",
                        height: "200px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        flexShrink: "0",
                        position: "relative",
                      }}
                    >
                      {emoji === "🍬🍬🍬" ? (
                        <>
                          {/* Left candy - behind and up-left */}
                          <span style={{
                            position: "absolute",
                            fontSize: "150px",
                            left: "calc(50% - 60px)",
                            top: "calc(50% - 15px)",
                            transform: "translate(-50%, -50%)",
                            zIndex: 1,
                          }}>🍬</span>
                          {/* Right candy - behind and up-right */}
                          <span style={{
                            position: "absolute",
                            fontSize: "150px",
                            left: "calc(50% + 60px)",
                            top: "calc(50% - 15px)",
                            transform: "translate(-50%, -50%)",
                            zIndex: 1,
                          }}>🍬</span>
                          {/* Middle candy - in front, centered */}
                          <span style={{
                            position: "absolute",
                            fontSize: "150px",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            zIndex: 2,
                          }}>🍬</span>
                        </>
                      ) : (
                        <span style={{
                          position: "absolute",
                          fontSize: "150px",
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                        }}>{emoji}</span>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Initial static display
              <div
                style={{
                  fontSize: "150px",
                  lineHeight: "1",
                  height: "200px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  position: "relative",
                }}
              >
                {isThreeCandies ? (
                  <>
                    {/* Left candy - behind and up-left */}
                    <span style={{
                      position: "absolute",
                      fontSize: "150px",
                      left: "calc(50% - 60px)",
                      top: "calc(50% - 15px)",
                      transform: "translate(-50%, -50%)",
                      zIndex: 1,
                    }}>🍬</span>
                    {/* Right candy - behind and up-right */}
                    <span style={{
                      position: "absolute",
                      fontSize: "150px",
                      left: "calc(50% + 60px)",
                      top: "calc(50% - 15px)",
                      transform: "translate(-50%, -50%)",
                      zIndex: 1,
                    }}>🍬</span>
                    {/* Middle candy - in front, centered */}
                    <span style={{
                      position: "absolute",
                      fontSize: "150px",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 2,
                    }}>🍬</span>
                  </>
                ) : (
                  <span style={{
                    position: "absolute",
                    fontSize: "150px",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}>{currentEmoji}</span>
                )}
              </div>
            )}
          </div>

          {/* Sparkle Burst - shows when spinning */}
          {showSparkles ? (
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                width: "0",
                height: "0",
                pointerEvents: "none",
                zIndex: 1000,
              }}
            >
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst0 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst1 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst2 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst3 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst4 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst5 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst6 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst7 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst8 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst9 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst10 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst11 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst12 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst13 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst14 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst15 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst16 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst17 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst18 2s ease-out forwards" }}>⭐</div>
              <div style={{ position: "absolute", left: "0", top: "0", fontSize: "40px", animation: "sparkleBurst19 2s ease-out forwards" }}>⭐</div>
            </div>
          ) : null}

          {/* CSS Animations */}
          <style>{`
            /* Sparkle burst animations */}
            @keyframes sparkleBurst0  { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(300px, 0px) rotate(720deg) scale(1.5); opacity: 0; } }
            @keyframes sparkleBurst1  { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(285px, 95px) rotate(750deg) scale(1.6); opacity: 0; } }
            @keyframes sparkleBurst2  { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(235px, 180px) rotate(680deg) scale(1.4); opacity: 0; } }
            @keyframes sparkleBurst3  { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(155px, 255px) rotate(810deg) scale(1.7); opacity: 0; } }
            @keyframes sparkleBurst4  { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(50px, 295px) rotate(740deg) scale(1.5); opacity: 0; } }
            @keyframes sparkleBurst5  { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(-60px, 295px) rotate(770deg) scale(1.6); opacity: 0; } }
            @keyframes sparkleBurst6  { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(-165px, 250px) rotate(690deg) scale(1.4); opacity: 0; } }
            @keyframes sparkleBurst7  { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(-245px, 175px) rotate(800deg) scale(1.7); opacity: 0; } }
            @keyframes sparkleBurst8  { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(-290px, 85px) rotate(720deg) scale(1.5); opacity: 0; } }
            @keyframes sparkleBurst9  { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(-300px, -10px) rotate(760deg) scale(1.6); opacity: 0; } }
            @keyframes sparkleBurst10 { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(-285px, -105px) rotate(700deg) scale(1.4); opacity: 0; } }
            @keyframes sparkleBurst11 { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(-230px, -190px) rotate(790deg) scale(1.7); opacity: 0; } }
            @keyframes sparkleBurst12 { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(-150px, -260px) rotate(730deg) scale(1.5); opacity: 0; } }
            @keyframes sparkleBurst13 { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(-45px, -300px) rotate(770deg) scale(1.6); opacity: 0; } }
            @keyframes sparkleBurst14 { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(65px, -295px) rotate(690deg) scale(1.4); opacity: 0; } }
            @keyframes sparkleBurst15 { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(170px, -245px) rotate(800deg) scale(1.7); opacity: 0; } }
            @keyframes sparkleBurst16 { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(250px, -170px) rotate(720deg) scale(1.5); opacity: 0; } }
            @keyframes sparkleBurst17 { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(295px, -80px) rotate(760deg) scale(1.6); opacity: 0; } }
            @keyframes sparkleBurst18 { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(300px, 15px) rotate(700deg) scale(1.4); opacity: 0; } }
            @keyframes sparkleBurst19 { 0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(290px, 100px) rotate(790deg) scale(1.7); opacity: 0; } }

            @keyframes slotSpin1 {
              0% {
                transform: translateY(0);
              }
              100% {
                transform: translateY(-2800px);
              }
            }
            @keyframes slotSpin2 {
              0% {
                transform: translateY(0);
              }
              100% {
                transform: translateY(-2800px);
              }
            }
            @keyframes slideUp {
              0% {
                transform: translateY(20px);
                opacity: 0;
              }
              100% {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `}</style>

          {/* Spin Button */}
          <ct-button
            onClick={spin({
              currentEmoji,
              isSpinning,
              generosity,
              spinSequence,
              spinCount,
              spinHistory,
            })}
            style={{
              fontSize: "32px",
              padding: "20px 40px",
              fontWeight: "bold",
            }}
          >
            🎰 SPIN!
          </ct-button>

          {/* Subtle controls at bottom - not obvious to kids */}
          <div
            style={{
              position: "fixed",
              bottom: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              fontSize: "9px",
              color: "#94a3b8",
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              padding: "6px 10px",
              borderRadius: "3px",
              backdropFilter: "blur(4px)",
            }}
          >
            {/* Payout visualization - appears above TADA */}
            {showPayouts ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  marginBottom: "6px",
                  animation: "slideUp 0.3s ease-out",
                  position: "relative",
                }}
              >
                {/* Close button */}
                <button
                  onClick={closePayouts({ showPayouts })}
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "white",
                    fontSize: "10px",
                    lineHeight: "1",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0",
                    color: "#64748b",
                  }}
                >
                  ×
                </button>

                {payoutPercentages.map((prize, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "10px",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>{prize.emoji}</span>
                    <div
                      style={{
                        width: "100px",
                        height: "12px",
                        backgroundColor: "#e2e8f0",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${prize.percent}%`,
                          height: "100%",
                          backgroundColor: i === 2 ? "#f87171" : "#4ade80",
                          transition: "width 0.3s ease-out",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "9px", minWidth: "30px" }}>
                      {Math.round(prize.percent)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Visual readout: TADA emojis based on generosity level */}
            <div style={{ fontSize: "12px", minHeight: "16px", lineHeight: "1" }}>
              {tadaDisplay}
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={decrementGenerosity({ generosity, showPayouts })}
                disabled={minusDisabled}
                style={{
                  fontSize: "14px",
                  padding: "2px 8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "2px",
                  background: "white",
                  cursor: minusDisabled ? "not-allowed" : "pointer",
                  opacity: minusDisabled ? 0.5 : 1,
                }}
              >
                −
              </button>
              <button
                onClick={incrementGenerosity({ generosity, showPayouts })}
                disabled={plusDisabled}
                style={{
                  fontSize: "14px",
                  padding: "2px 8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "2px",
                  background: "white",
                  cursor: plusDisabled ? "not-allowed" : "pointer",
                  opacity: plusDisabled ? 0.5 : 1,
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      ),
      currentEmoji,
      isSpinning,
      generosity,
      spinSequence,
      spinCount,
      showPayouts,
      spinHistory,
    };
  }
);
