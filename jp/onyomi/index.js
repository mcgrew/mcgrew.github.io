$ = document.querySelector.bind(document);
$$ = document.querySelectorAll.bind(document);

function shuffle(list) {
    return [...list].sort(() => 0.5 - Math.random());
}

/** @param repeat how many seconds before the card should repeat.
 */
function nextDue(repeat) {
    return Math.round(new Date().getTime() / 1000) + (repeat || 0);
}

function nextRepeat(repeat, incorrect) {
    // 3m 15s minimum. This multiplies by 2 cleanly into days
    // does this matter? not really.
    return Math.max((repeat || 0) * (2 - incorrect), 225)
}

function save() {
    localStorage.setItem('onyomi', JSON.stringify(kanji.scheduled));
}

function getOptions(readings) {
    const readingSet = new Set(readings);
    const possible = [...kanji.readings].filter(item => !readingSet.has(item));
    const options = [...shuffle(possible).slice(0, $$('button').length - 1), readings[0]]
    return shuffle(options);
}

function nextKanji() {
    const cards = kanji.due();
    const due = $('#due');
    if (cards.length) {
        due.style.removeProperty('display');
        due.innerText = `${cards.length}`;
        return shuffle(cards)[0];
    } else {
        due.style.display = 'none';
        const scheduled = new Set(Object.keys(kanji.scheduled));
        const keys = Object.keys(kanji.all).filter(k => !scheduled.has(k));
        if (keys.length) {
            return (keys.sort((a, b) => 
                (kanji.all[a].freq || 9999) - (kanji.all[b].freq || 9999))[0]);
        } else {
            return shuffle(Object.keys(kanji.all))[0]
        }
    }
}

function populate(pickedKanji) {
    const k = window.card = pickedKanji || nextKanji();
    const entry = kanji.all[k];
    const options = getOptions(entry.readings_on);
    const answer = $('#answer');
    const def = entry.wk_meanings ? entry.wk_meanings[0] : entry.meanings[0];
    const alt_def = entry.meanings.filter(m => m != def).join(', ')
    $('#kanji').innerText = k;
    $('#meaning').innerText = def;
    $('#alt-meaning').innerText = alt_def;
    $('#other_readings').innerText = ''
    answer.dataset.value = entry.readings_on[0];
    answer.innerText = '';
    answer.classList.remove('correct');
    answer.classList.remove('incorrect');
    $$('button').forEach(b => {
        b.classList.remove('correct');
        b.classList.remove('incorrect');
        const value = options.pop();
        b.innerText = value;
        b.dataset.value = value;
    });
}
function checkAnswer(button) {
    if (button.classList.contains('incorrect'))
        return;
    const answer = $('#answer');
    const incorrect = $$('button.incorrect').length;
    if (button.dataset.value == answer.dataset.value) {
        answer.innerText = '正確！';
        answer.className = 'correct';
        button.classList.add('correct');
        reveal();
        let sched = kanji.scheduled[window.card] || {};
        sched.repeat = nextRepeat(sched.repeat, incorrect)
        sched.due = nextDue(sched.repeat)
        kanji.scheduled[window.card] = sched;
        save()
    } else {
        answer.innerText = '不正確！';
        answer.className = 'incorrect';
        button.classList.add('incorrect');
        if (incorrect == 1) {
            reveal();
            kanji.scheduled[window.card] = {
                due: nextDue(),
                repeat: nextRepeat()
            };
            save()
        }
    }
}

function reveal() {
    $$('button').forEach(b => {
        if (b.dataset.value == $('#answer').dataset.value) {
            b.classList.add('correct');
        }
    });
    const readings = kanji.all[window.card].readings_on.slice(1);
    if (readings.length)
        $('#other_readings').innerText =
            '他の音訓： ' + readings.join('、 ');
}

window.addEventListener('load', function() {
    fetch('../kanji.json').then(response => {
        window.kanji = {
            all: [],
            readings: new Set(),
            scheduled: JSON.parse(localStorage.getItem('onyomi') || '{}'),
            due: () => {
                const now = nextDue();
                const sched = Object.keys(kanji.scheduled);
                return sched.filter(k => kanji.scheduled[k].due < now)
            }
        }
        if (!response.ok) {
            throw Error('Unable to load kanji.database!')
        }
        response.json().then(data => {
            kanji.all = data;
            // remove any that don't have onyomi readings and meanings
            Object.keys(kanji.all).forEach(k => {
                const entry = kanji.all[k];
                if (!entry.readings_on.length || !entry.meanings.length)
                    delete kanji.all[k]
            });
            const allKeys = Object.keys(kanji.all)
            allKeys.forEach(k => {
                kanji.all[k].readings_on.forEach(
                    r => kanji.readings.add(r.replace('-', '')));

            });
            populate();
            $$('button').forEach(b => {
                b.addEventListener('click', function() { 
                    if ($$('button.correct').length) return;
                    checkAnswer(this);
                });
            });
            $('#answer').addEventListener( 'click',
                () => {if ($$('button.correct').length) populate()});
        });
    });
});
