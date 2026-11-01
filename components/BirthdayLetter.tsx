import React, { useEffect, useState } from 'react';

interface BirthdayLetterProps {
  onBack: () => void;
}

export const BirthdayLetter: React.FC<BirthdayLetterProps> = ({ onBack }) => {
  const [opened, setOpened] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const openTimer = window.setTimeout(() => setOpened(true), 550);
    const revealTimer = window.setTimeout(() => setRevealed(true), 1450);
    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(revealTimer);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-[80] overflow-hidden bg-[radial-gradient(circle_at_50%_22%,#7b263d_0%,#3a1426_38%,#12080d_78%)] text-[#4b261f]">
      <style>{`
        @keyframes letter-drift-in {
          0% { opacity: 0; transform: translateY(80px) scale(.82) rotate(-3deg); }
          65% { opacity: 1; transform: translateY(-8px) scale(1.02) rotate(.5deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
        }
        @keyframes letter-glow {
          0%, 100% { opacity: .35; transform: scale(.95); }
          50% { opacity: .75; transform: scale(1.08); }
        }
        @keyframes ink-reveal {
          from { opacity: 0; transform: translateY(18px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>

      <div className="absolute left-[10%] top-[13%] h-36 w-36 rounded-full bg-[#f7cf79]/15 blur-3xl [animation:letter-glow_4s_ease-in-out_infinite]" />
      <div className="absolute bottom-[8%] right-[8%] h-48 w-48 rounded-full bg-[#d9909f]/15 blur-3xl [animation:letter-glow_5s_ease-in-out_infinite_reverse]" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(255,238,190,.35)_0_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="relative flex h-full w-full items-center justify-center p-4 md:p-8">
        <div
          className="relative h-[88vh] max-h-[940px] w-full max-w-4xl [animation:letter-drift-in_1.1s_cubic-bezier(.2,.9,.2,1)_both]"
          style={{ perspective: '1400px' }}
        >
          <div className="absolute bottom-0 left-1/2 z-0 h-[46%] w-[94%] -translate-x-1/2 rounded-b-[2.2rem] border border-[#e0b45d]/45 bg-[#8c2947] shadow-[0_35px_100px_rgba(0,0,0,.55)] md:w-[88%]" />

          <div
            className="absolute bottom-[38%] left-1/2 h-0 w-0 transition-all duration-1000"
            style={{
              borderLeft: 'min(44vw, 330px) solid transparent',
              borderRight: 'min(44vw, 330px) solid transparent',
              borderTop: '170px solid #ad3c59',
              transform: `translateX(-50%) rotateX(${opened ? '-180deg' : '0deg'})`,
              transformOrigin: 'top center',
              backfaceVisibility: 'hidden',
              zIndex: opened ? 5 : 35,
              opacity: opened ? 0 : 1,
            }}
          />

          <article
            className="absolute left-1/2 z-20 flex w-[90%] -translate-x-1/2 flex-col overflow-y-auto rounded-[1.4rem] border border-[#cba45a]/40 bg-[#fff9e9] px-6 py-8 shadow-[0_25px_80px_rgba(30,8,15,.38)] transition-all duration-[1200ms] ease-[cubic-bezier(.2,.85,.2,1)] md:w-[80%] md:px-12 md:py-10"
            style={{
              bottom: opened ? '3%' : '3%',
              height: opened ? '94%' : '43%',
              opacity: opened ? 1 : 0.96,
            }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(125,76,42,.06)_1px,transparent_1px)] [background-size:100%_30px]" />
            <div
              className="relative mx-auto w-full max-w-2xl transition-opacity duration-700"
              style={{
                opacity: revealed ? 1 : 0,
                animation: revealed ? 'ink-reveal .9s ease both' : 'none',
              }}
            >
              <p className="text-center text-xs tracking-[0.42em] text-[#ad6e53]">A LETTER JUST FOR YOU</p>
              <div className="mx-auto my-5 h-px w-20 bg-[#c99d55]" />
              <h1 className="text-center font-serif text-2xl font-bold text-[#7b2c35] md:text-3xl">给我亲爱的悦姐</h1>

              <div className="mt-7 space-y-4 font-serif text-[15px] leading-[2.05] text-[#55342c] md:text-lg md:leading-[2.15]">
                <p>这是一个独属于你的生日网页，希望看到此处你能感到幸福。</p>
                <p>我亲爱的悦姐，再一次生日快乐！</p>
                <p>还记得去年毕业的祝福吗？小满即万全。今天同样再次祝上：24岁也不过是6岁的大人而已。</p>
                <p>你已经做得很棒很棒啦。希望你不会被困于对完美无缺的追求，在你的每一个阶段都能找到自己的幸福和满足！</p>
              </div>

              <div className="mt-8 text-right font-serif italic text-[#9a5960]">
                <p>Happy 24th Birthday</p>
                <p className="mt-1 text-sm not-italic tracking-[0.2em]">小满即万全</p>
              </div>

              <button
                type="button"
                onClick={onBack}
                className="mx-auto mt-8 block rounded-full border border-[#9a5960]/45 px-5 py-2 text-xs tracking-[0.2em] text-[#7b2c35] transition hover:bg-[#7b2c35] hover:text-[#fff9e9]"
              >
                返回生日蛋糕
              </button>
            </div>
          </article>

          <div
            className="pointer-events-none absolute bottom-0 left-1/2 w-[94%] -translate-x-1/2 overflow-hidden rounded-b-[2.2rem] transition-all duration-1000 md:w-[88%]"
            style={{
              height: opened ? '10%' : '43%',
              zIndex: opened ? 10 : 40,
              opacity: opened ? 0.78 : 1,
            }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(145deg,#a23856_0%,#7b213e_100%)] [clip-path:polygon(0_0,50%_72%,100%_0,100%_100%,0_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(215deg,rgba(255,255,255,.08),transparent_45%)]" />
          </div>
        </div>
      </div>
    </div>
  );
};
