/* <Tên game> — <kỹ năng luyện tập>. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;
  const GAME_ID = "game-id"; // trùng data-game và catalog.js

  const LEVELS = [
    { name: "Level dễ", desc: "Mô tả ngắn", rounds: 5 },
    { name: "Level khó", desc: "Mô tả ngắn", rounds: 5 },
  ];

  // Toàn bộ trạng thái nằm trong một object để dễ debug
  const S = { lv: 0, level: null, round: 0, score: 0, correct: 0, done: false };

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.round = 0; S.score = 0; S.correct = 0;
    $("#hud-level").textContent = i + 1;
    G.showScreen("play");
    nextRound();
  }

  function nextRound() {
    if (S.round >= S.level.rounds) return finish();
    S.round++; S.done = false;
    $("#hud-round").textContent = `${S.round}/${S.level.rounds}`;
    $("#hud-score").textContent = S.score;
    $("#btn-next").hidden = true;
    setFeedback("Hướng dẫn cho vòng này…");
    // TODO: sinh đề, vẽ khu vực chơi vào #stage
  }

  function answer(isRight) {
    if (S.done) return;
    S.done = true;
    if (isRight) {
      S.score += 10; S.correct++;
      G.sound.play("good");
      setFeedback("✓ Đúng! <span class='detail'>Giải thích vì sao đúng.</span>", "good");
    } else {
      G.sound.play("bad");
      setFeedback("✗ Chưa đúng. <span class='detail'>Giải thích lỗi sai cụ thể.</span>", "bad");
    }
    $("#hud-score").textContent = S.score;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  function finish() {
    const { isNew } = G.progress.record(GAME_ID, S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    $("#end-detail").textContent = `Đúng ${S.correct}/${S.level.rounds}.` + (isNew ? " Kỷ lục mới!" : "");
    if (S.correct === S.level.rounds) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  $("#btn-next").addEventListener("click", nextRound);
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
