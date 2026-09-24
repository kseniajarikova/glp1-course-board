(function(){
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
  const escText = value => String(value || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const cap = value => {
    const s = String(value || "").trim();
    return s ? s.charAt(0).toLocaleUpperCase("ru-RU") + s.slice(1) : s;
  };
  const normalize = value => String(value || "").toLocaleLowerCase("ru-RU").replace(/ё/g,"е").trim();
  let dirty = false;
  let selectedIngredients = [];

  const style = document.createElement("style");
  style.textContent = [
    ".brand-lockup{display:inline-flex;align-items:center;gap:12px;color:var(--ink);font-weight:800;letter-spacing:-.04em}",
    ".brand-glp{font-size:26px;letter-spacing:-.08em}.brand-rule{width:72px;height:7px;border-radius:10px;background:#b9efd5;display:inline-block}.brand-course{font-size:12px;line-height:1.05;letter-spacing:.02em;font-weight:700;color:var(--muted)}",
    ".student-tabs{display:flex;gap:8px;margin:24px 0 18px;padding:5px;border:1px solid var(--line);border-radius:16px;background:var(--soft)}",
    ".student-tab{flex:1;border:0;border-radius:12px;padding:13px 16px;background:transparent;color:var(--muted);font-weight:700;cursor:pointer}.student-tab.active{background:var(--ink);color:#fff}",
    ".student-view[hidden]{display:none}.student-guide{padding:22px;border-radius:20px;background:linear-gradient(135deg,var(--mint-soft),#fff);border:1px solid #dcece2;margin-bottom:18px}.student-guide h2{margin:4px 0 8px}.student-guide p{margin:0;color:var(--muted);max-width:760px}",
    ".student-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}.student-step{padding:14px;border-radius:14px;background:#fff;border:1px solid var(--line)}.student-step b{display:block;margin-bottom:4px}.student-step span{color:var(--muted);font-size:13px}",
    ".confirm-protein{margin:14px 0 0}.protein-dirty{color:var(--coral-dark);font-size:12px;margin:8px 0 0;min-height:18px}",
    ".ingredient-box{margin:20px 0 0;padding:18px;border:1px solid var(--line);border-radius:18px;background:#fff}.ingredient-box h3{margin:0 0 6px}.ingredient-box p{margin:0 0 12px;color:var(--muted);font-size:13px}.ingredient-picker{display:flex;gap:8px;flex-wrap:wrap}.ingredient-chip{border:1px solid var(--line);background:var(--soft);border-radius:999px;padding:8px 12px;cursor:pointer;color:var(--ink)}.ingredient-chip.active{background:var(--mint);border-color:#acd8bf;font-weight:700}",
    ".calculator-results{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}.calculator-recipe{border:1px solid var(--line);border-radius:16px;overflow:hidden;background:#fff}.calculator-recipe img{width:100%;aspect-ratio:1.35;object-fit:cover;display:block}.calculator-recipe-body{padding:14px}.calculator-recipe h3{font-size:17px;line-height:1.1;margin:5px 0 9px}.calculator-recipe .mini-meta{color:var(--muted);font-size:13px;margin-bottom:12px}.calculator-recipe .btn{width:100%}",
    ".menu-student-note{padding:17px 20px;border-radius:18px;background:var(--blue-soft);border:1px solid #d8e6ef;margin-bottom:16px}.menu-student-note p{margin:4px 0 0;color:var(--blue-dark)}",
    ".student-footer{margin-top:20px;color:var(--muted);font-size:13px}",
    "@media(max-width:760px){.student-steps,.calculator-results{grid-template-columns:1fr}.student-tabs{position:sticky;top:8px;z-index:3}.student-tab{padding:11px 8px;font-size:13px}.brand-rule{width:52px}.brand-course{font-size:10px}}"
  ].join("");
  document.head.appendChild(style);

  const top = $(".top");
  if(top){
    const eyebrow = $(".eyebrow", top);
    if(eyebrow) eyebrow.outerHTML = '<div class="brand-lockup" aria-label="Курс на устойчивость"><span class="brand-glp">GLP</span><span class="brand-rule"></span><span class="brand-course">Курс на<br>устойчивость</span></div>';
    const title = $(".title", top);
    if(title) title.textContent = "Меню, которое работает на тебя";
    const lede = $(".lede", top);
    if(lede) lede.remove();
    const links = $(".toplinks", top);
    if(links) links.innerHTML = '<a class="pill" href="#settings">Настроить белок</a><a class="pill" href="#menuView">К меню</a>';
  }

  const how = $(".how");
  if(how){
    how.innerHTML = '<div class="kicker">Как пользоваться меню</div><h2>Настрой меню под себя</h2><div class="how-grid"><div class="how-card"><strong>1. Рассчитай свой ориентир по белку</strong><span>Для этого введи рост и вес. Если у тебя есть рекомендация от специалиста, введи её.</span></div><div class="how-card"><strong>2. Выбери текущую неделю</strong><span>На неделях 1–2 доступны 15 базовых рецептов. Они случайно распределяются по дням, и любое блюдо можно заменить. Небольшая подборка помогает понять ритм без выбора из всей базы.</span></div><div class="how-card"><strong>3. Открой рецепт</strong><span>На неделях 3–6 доступна полная база уникальных рецептов. Открой карточку, посмотри продукты на свою порцию и при необходимости выбери замену.</span></div></div>';
  }

  const settings = $(".settings");
  const weekSwitch = $(".week-switch");
  const menu = $("#menu");
  const library = $("#library");
  if(!settings || !weekSwitch || !menu || !library) return;

  const tabs = document.createElement("nav");
  tabs.className = "student-tabs";
  tabs.setAttribute("aria-label","Раздел меню");
  tabs.innerHTML = '<button class="student-tab active" data-view="calculator">Калькулятор слотов</button><button class="student-tab" data-view="menu">Моё меню</button>';

  const calculatorView = document.createElement("section");
  calculatorView.className = "student-view";
  calculatorView.id = "calculatorView";
  const menuView = document.createElement("section");
  menuView.className = "student-view";
  menuView.id = "menuView";
  menuView.hidden = true;

  settings.parentNode.insertBefore(tabs, settings);
  settings.parentNode.insertBefore(calculatorView, settings);
  calculatorView.appendChild(settings);
  menuView.appendChild(weekSwitch);
  menuView.appendChild(menu);
  menuView.appendChild(library);
  calculatorView.after(menuView);

  const guide = document.createElement("div");
  guide.className = "student-guide";
  guide.innerHTML = '<div class="kicker">С чего начать</div><h2>Сначала введи свой ориентир по белку</h2><p>После подтверждения меню настроится под твою дневную цель. Ниже появятся рецепты, в которых используются выбранные продукты.</p><div class="student-steps"><div class="student-step"><b>Введи данные</b><span>Рекомендацию специалиста или рост и вес.</span></div><div class="student-step"><b>Подтверди</b><span>Мы покажем количество белковых слотов на день.</span></div><div class="student-step"><b>Выбери рецепт</b><span>Открой карточку и замени блюдо, если нужно.</span></div></div>';
  calculatorView.insertBefore(guide, settings);

  const confirm = document.createElement("button");
  confirm.id = "confirmProtein";
  confirm.className = "btn btn-primary confirm-protein";
  confirm.textContent = "Подтвердить и настроить меню";
  const settingsNote = $(".settings-note", settings);
  if(settingsNote) settingsNote.before(confirm);
  const dirtyNote = document.createElement("p");
  dirtyNote.className = "protein-dirty";
  dirtyNote.setAttribute("aria-live","polite");
  dirtyNote.textContent = "";
  confirm.after(dirtyNote);

  const ingredientBox = document.createElement("section");
  ingredientBox.className = "ingredient-box";
  ingredientBox.innerHTML = '<h3>Найти рецепты по продуктам</h3><p>Выбери продукты, которые есть под рукой. Ниже покажем блюда из нашей базы, где они используются.</p><div class="ingredient-picker" id="ingredientPicker"></div><div class="calculator-results" id="calculatorResults"></div>';
  calculatorView.appendChild(ingredientBox);

  const menuNote = document.createElement("div");
  menuNote.className = "menu-student-note";
  menuNote.innerHTML = '<div class="kicker">Моё меню</div><strong>Выбери неделю и настрой свой ритм</strong><p>На первой и второй неделе работает общий пул из 15 базовых рецептов. С третьей по шестую неделю база расширяется: рецепты между неделями не повторяются.</p>';
  menuView.insertBefore(menuNote, weekSwitch);

  function setView(view){
    const isMenu = view === "menu";
    calculatorView.hidden = isMenu;
    menuView.hidden = !isMenu;
    $$(".student-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
    if(isMenu && typeof window.renderMenu === "function") window.renderMenu();
    if(!isMenu) renderCalculatorRecipes();
  }
  $$(".student-tab").forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));

  function setFields(){
    const calc = $("#mode").value === "calculation";
    $("#recommendationField").hidden = calc;
    $("#weightField").hidden = !calc;
    $("#heightField").hidden = !calc;
  }
  function calculateTarget(){
    const mode = $("#mode").value;
    if(mode === "recommendation"){
      const raw = Number($("#recommendation").value);
      return Math.max(40, Math.min(250, Number.isFinite(raw) && raw > 0 ? raw : 90));
    }
    const w = Math.max(35, Math.min(300, Number($("#weight").value) || 75));
    const h = Math.max(1.35, Math.min(2.2, (Number($("#height").value) || 170) / 100));
    const bmi = w / (h*h);
    const ideal = 25 * h * h;
    const calculatedMass = bmi < 25 ? w : ideal + .25 * (w - ideal);
    const uncapped = calculatedMass * 1.2;
    return Math.max(60, Math.min(120, Math.round(uncapped / 10) * 10));
  }
  function renderStudentSummary(){
    const mode = $("#mode").value;
    $("#target").textContent = Math.round(target);
    $("#slotResult").textContent = mode === "calculation" ? slotText(target) : slotRangeText(target);
    $("#proteinSource").textContent = mode === "calculation" ? "Расчёт по росту и весу" : "Рекомендация специалиста";
    const week = activeWeek < 3 ? 1 : activeWeek;
    const split = mealTargets(week);
    const order = week < 3 ? ["breakfast","lunch","dinner"] : ["breakfast","lunch","snack","dinner"];
    $("#proteinSplits").innerHTML = '<span class="summary-label" style="width:100%">Пример распределения по приёмам пищи</span>' + order.map(type => '<span class="split-chip"><span>'+roles[type]+'</span><b>'+slotText(split[type])+'</b></span>').join("");
    $("#proteinGuidance").textContent = mode === "calculation" ? "Мы рассчитываем ориентир по белку на основе рекомендаций по питанию во время терапии агонистами GLP-1. В расчёте уже учтён уровень физической активности, который предусмотрен на курсе." : "Если у тебя есть рекомендация специалиста, используй её как ориентир. Слоты показывают, как распределить белок между приёмами пищи.";
    const warning = mode === "recommendation" && (target < 40 || target > 200);
    $("#proteinWarning").hidden = !warning;
    $("#proteinWarning").textContent = warning ? "Проверь, нет ли ошибки в указанном количестве белка." : "";
  }
  function markDirty(){
    dirty = true;
    dirtyNote.textContent = "Нажми «Подтвердить и настроить меню», чтобы применить изменения.";
  }
  window.markProteinDirty = markDirty;
  window.toggleMode = function(){
    setFields();
    markDirty();
  };
  window.recalculate = markDirty;
  window.confirmProtein = function(){
    target = calculateTarget();
    dirty = false;
    dirtyNote.textContent = "Готово: меню настроено под твой ориентир.";
    renderStudentSummary();
    if(typeof window.renderMenu === "function") window.renderMenu();
    renderCalculatorRecipes();
  };
  $("#mode").onchange = window.toggleMode;
  ["recommendation","weight","height"].forEach(id => {
    const input = $("#"+id);
    if(input) input.oninput = markDirty;
  });
  confirm.onclick = window.confirmProtein;
  setFields();

  const originalNutrition = window.nutrition;
  window.nutrition = function(x,type,week){
    const p = desired(type, week === undefined ? activeWeek : week);
    const k = Math.round(x.kcal * (p / x.p));
    return '<div class="nutrition"><span>'+k+' ккал</span><span>'+slotText(p)+'</span></div>';
  };

  DATA.weekTitles[1] = "Баланс и простота";
  DATA.weekTitles[2] = "Переносимость и выбор";
  DATA.weekTitles[3] = "Комфорт и мягкая текстура";
  DATA.weekTitles[4] = "Полноценная тарелка";
  DATA.weekTitles[5] = "Гибкость в течение дня";
  DATA.weekTitles[6] = "Своя система";
  DATA.weekFocus[1] = "Базовые рекомендации по питанию и составлению тарелки.";
  DATA.weekFocus[2] = "Знакомый пул рецептов и возможность выбрать то, что лучше переносится сегодня.";
  DATA.weekFocus[3] = "Нежные по текстуре блюда, супы и варианты для дней, когда аппетит снижен.";
  DATA.weekFocus[4] = "Овощи, бобовые, крупы и белковые блюда в простых домашних сочетаниях.";
  DATA.weekFocus[5] = "Простые блюда, которые удобно собрать дома, взять с собой или адаптировать под небольшой аппетит.";
  DATA.weekFocus[6] = "Разные белковые опоры и гарниры, чтобы собрать собственный удобный ритм.";

  window.renderProteinSummary = renderStudentSummary;
  window.renderMenu = function(){
    const sections = Array.from({length:6}, (_,i) => weekSection(i+1)).join("");
    const note = activeWeek < 3
      ? "В этой неделе используется общий пул из 15 базовых рецептов. Раскладка случайная, любое блюдо можно заменить."
      : "На этой неделе собраны уникальные рецепты. Любое блюдо можно заменить на вариант из той же категории.";
    $("#menu").innerHTML = '<div class="menu-intro"><div><div class="kicker">Неделя '+activeWeek+'</div><h2>'+escText(DATA.weekTitles[activeWeek])+'</h2><p>'+escText(note)+'</p></div></div>'+sections;
    if(typeof window.renderProteinSummary === "function") window.renderProteinSummary();
  };
  window.setWeek = function(n){
    activeWeek = n;
    for(let i=1;i<=6;i++) $("#weekButton"+i).classList.toggle("active", i===n);
    window.renderProteinSummary();
    window.renderMenu();
    const section = $("#week-section-"+n);
    if(section){
      section.open = true;
      setTimeout(() => section.scrollIntoView({behavior:"smooth",block:"start"}), 30);
    }
  };
  window.shuffleSpecific = function(n){
    activeWeek = n;
    if(n < 3) makeEarlyWeek(n); else makeLateWeek(n);
    window.renderMenu();
    window.renderProteinSummary();
    setTimeout(() => { const section = $("#week-section-"+n); if(section) section.scrollIntoView({behavior:"smooth",block:"start"}); }, 30);
  };
  window.shuffleAll = function(){
    makeAll();
    window.renderMenu();
    window.renderProteinSummary();
  };

  function typeForId(id){
    const c = String(id || "")[2];
    return c === "b" ? "breakfast" : c === "d" ? "dinner" : c === "l" ? "lunch" : "snack";
  }
  function entries(){
    const early = Object.entries(DATA.earlyRecipes).flatMap(([type, list]) => list.map(x => ({x,type,week:1})));
    const late = Object.entries(DATA.lateRecipes).map(([id,x]) => ({x,type:typeForId(id),week:Number(id[1])}));
    return early.concat(late);
  }
  function recipeMatches(x){
    if(!selectedIngredients.length) return true;
    const hay = (x.ingredients || []).map(i => normalize(i[0])).join(" ");
    return selectedIngredients.every(needle => hay.includes(normalize(needle)));
  }
  function calculatorRecipeCard(item){
    const x=item.x, type=item.type, week=item.week, portion=desired(type,week);
    return '<article class="calculator-recipe"><img src="'+imageFor(x,type)+'" alt="'+escText(x.name)+'" loading="lazy"><div class="calculator-recipe-body"><div class="kicker">'+roles[type]+'</div><h3>'+escText(x.name)+'</h3><div class="mini-meta">'+Math.round(x.kcal*(portion/x.p))+' ккал · '+slotText(portion)+'</div><button class="btn btn-primary" onclick="openRecipe(\''+x.id+'\','+week+',0,\''+type+'\')">Открыть рецепт</button></div></article>';
  }
  function renderIngredientPicker(){
    const all = entries();
    const preferred = ["Яйца","Йогурт греческий","Творог","Куриное филе","Индейка","Рыба","Овсянка","Рис","Картофель","Овощи"];
    const available = preferred.filter(name => all.some(item => (item.x.ingredients || []).some(i => normalize(i[0]).includes(normalize(name)) || normalize(name).includes(normalize(i[0])))));
    $("#ingredientPicker").innerHTML = available.map(name => '<button type="button" class="ingredient-chip '+(selectedIngredients.includes(name)?"active":"")+'" data-ingredient="'+escText(name)+'">'+escText(name)+'</button>').join("");
    $$(".ingredient-chip", $("#ingredientPicker")).forEach(btn => btn.onclick = () => {
      const name=btn.dataset.ingredient;
      selectedIngredients = selectedIngredients.includes(name) ? selectedIngredients.filter(x=>x!==name) : selectedIngredients.concat(name);
      renderIngredientPicker();
      renderCalculatorRecipes();
    });
  }
  function renderCalculatorRecipes(){
    const result=$("#calculatorResults");
    if(!result) return;
    const all=entries().filter(item => recipeMatches(item.x));
    const base=selectedIngredients.length ? all : all.filter(item => item.week===1).slice(0,6);
    const list=(base.length ? base : all).slice(0,12);
    result.innerHTML = '<div style="grid-column:1/-1"><div class="kicker">Рецепты из базы</div><p style="margin:4px 0;color:var(--muted);font-size:13px">'+(selectedIngredients.length ? "Подобраны блюда, в которых есть выбранные продукты." : "Выбери продукты, чтобы сузить список.")+'</p></div>'+list.map(calculatorRecipeCard).join("") || '<p>Подходящих рецептов пока нет — попробуй снять один из фильтров.</p>';
  }

  window.openRecipe = function(id,week,day,type){
    const x=recipeFor(id);
    if(!x) return;
    const p=desired(type,week), scale=p/x.p;
    const ingredients=(x.ingredients||[]).map(item => "<li>"+escText(cap(item[0]))+" — "+escText(rounded(item,scale))+"</li>").join("");
    const steps=String(x.steps||"Собрать блюдо по рецепту.").split(/(?<=[.!?])\s+/).filter(Boolean).map(step => "<li>"+escText(cap(step))+"</li>").join("");
    $("#recipeModalKicker").textContent=roles[type]+(week>=3?" · неделя "+week:" · базовая библиотека");
    $("#recipeModalTitle").textContent=x.name;
    $("#recipeModalContent").innerHTML='<div class="recipe-modal-grid"><div><img class="modal-image" src="'+imageFor(x,type)+'" alt="'+escText(x.name)+'"></div><div><div class="modal-meta"><span>'+Math.round(x.kcal*(p/x.p))+' ккал</span><span>'+slotText(p)+'</span><span>'+escText(x.tag||"простая сборка")+'</span></div><section class="modal-section"><h3>Ингредиенты на твою порцию</h3><ul class="ingredients">'+ingredients+'</ul></section><section class="modal-section"><h3>Как приготовить</h3><ol class="steps">'+steps+'</ol></section><section class="modal-section"><h3>Хранение</h3><p class="storage">'+escText(cap(x.storage||"Хранить в холодильнике до 48 часов."))+'</p></section><div class="modal-actions">'+(week?'<button class="btn btn-primary" onclick="closeModal();openReplacement('+week+','+day+',\''+type+'\')">Заменить этот рецепт</button>':'')+'<button class="btn" onclick="closeModal()">Закрыть</button></div></div></div>';
    $("#recipeModal").hidden=false;
  };

  window.openReplacement = function(week,day,type){
    const t=slotTarget(week,day,type), current=currentId(week,day,type);
    const pool=poolFor(week,day,type).filter(item=>(item.id||item)!==current);
    replacement=t;
    $("#replaceModalTitle").textContent="Замена: "+roles[type].toLowerCase();
    $("#replacementGrid").innerHTML=pool.map(item=>{
      const x=item.id?item:recipeFor(item);
      return '<article class="replacement"><img src="'+imageFor(x,type)+'" alt="'+escText(x.name)+'"><div class="replacement-body"><strong>'+escText(x.name)+'</strong>'+window.nutrition(x,type,week)+'<button class="btn" onclick="chooseReplacement(\''+x.id+'\')">Выбрать рецепт</button></div></article>';
    }).join("") || "<p>Для этого слота пока нет альтернатив.</p>";
    $("#replaceModal").hidden=false;
  };
  window.chooseReplacement = function(id){
    const slot = replacement ? {week:replacement.week,day:replacement.day,type:replacement.type} : null;
    if(!slot) return;
    if(slot.week<3) earlyPlans[slot.week][slot.day][slot.type]=id;
    else {
      latePlans[slot.week][slot.day][slot.type]=id;
      if(slot.type==="dinner" && slot.day<6) latePlans[slot.week][slot.day+1].lunch=id;
      if(slot.type==="lunch" && slot.linked) latePlans[slot.week][slot.day].dinner=id;
    }
    closeModal();
    window.renderMenu();
    window.renderProteinSummary();
    setTimeout(() => {
      const section=$("#week-section-"+slot.week);
      if(!section) return;
      section.open=true;
      const name=recipeFor(id)?.name;
      const card=$$(".recipe-card",section).find(el => $(".meal-name",el)?.textContent.trim()===name);
      (card || section).scrollIntoView({behavior:"smooth",block:"center"});
    },50);
  };

  window.renderLibrary = function(){
    $("#libraryContent").innerHTML = renderLibraryGroup("breakfast","Завтраки")+renderLibraryGroup("lunch","Обеды")+renderLibraryGroup("dinner","Ужины");
  };

  renderIngredientPicker();
  renderCalculatorRecipes();
  window.renderProteinSummary();
  window.renderMenu();
  window.renderLibrary();
})();