/* lang.js — chọn ngôn ngữ (vi/en) TRƯỚC khi trang hiển thị, để không bị nháy chữ.
   Nạp trong <head>. Thứ tự ưu tiên: ?lang=… trên URL > lựa chọn đã lưu > mặc định "vi". */
(function () {
  var lang = "vi";
  try {
    var q = new URLSearchParams(location.search).get("lang");
    if (q === "vi" || q === "en") {
      lang = q;
      localStorage.setItem("itgames:lang", JSON.stringify(q));
    } else {
      var saved = JSON.parse(localStorage.getItem("itgames:lang"));
      if (saved === "vi" || saved === "en") lang = saved;
    }
  } catch (e) { /* localStorage bị chặn: dùng mặc định */ }
  document.documentElement.lang = lang;
  window.ITG_LANG = lang;
})();
