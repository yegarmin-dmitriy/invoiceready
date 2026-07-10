# Сценарий демо-видео (режиссёрская версия на русском)

Все указания, тайминги и действия на экране на русском. Реплики, которые ты
произносишь вслух, на английском (видео сдаём на EN). Английские фразы даны в
блоках «Говоришь (EN)» и их можно читать дословно.

Цель по хронометражу: около 2:15, жёсткий потолок 5:00.

Ссылки:
- Приложение (live): https://invoiceready-air-slate.vercel.app
- Телесуфлёр для чтения: https://invoiceready-air-slate.vercel.app/demo-script.html
- Презентация (можно как заставка/бирол): https://invoiceready-air-slate.vercel.app/deck.html

## Подготовка к записи

- Браузер в тёмной теме, окно на весь экран, без панели закладок, уведомления
  выключены. Разрешение записи 1080p.
- Курсор веди спокойно и медленно, без рывков.
- Файл для демо: `~/Desktop/invoiceready-demo/photo-france.jpg` (уже проверен,
  распознаётся корректно). Он должен быть на виду, чтобы его открыть и потом
  перетащить.
- Ключ LiteLLM подключён, распознавание на live работает по-настоящему.
- Прогони весь путь один раз до записи (чек-лист в конце).

---

## Сцена 1. Крючок (0:00 to 0:20)

На экране: медленно показываешь лендинг. Дай прочитать заголовок и три карточки.

Говоришь (EN):
> "In 2026, e-invoicing becomes mandatory across the European Union. Poland,
> Belgium, France and more. And they will not accept a PDF or an Excel file.
> Millions of small businesses are about to find out their invoices no longer
> count. InvoiceReady fixes that in about thirty seconds."

## Сцена 2. Фото инвойса, и это настоящий AI (0:20 to 1:20)

На экране (шаг 1, показать файл): открываешь `photo-france.jpg`, например пробелом
(Quick Look) или двойным кликом в Preview. Дай зрителю увидеть, что это кривое
фото бумажного инвойса с наклоном и тенями. Затем закрываешь просмотр.

Говоришь (EN):
> "This is a paper invoice, photographed on a phone. Crooked, with shadows. The
> kind of file that is useless to any accounting system today."

На экране (шаг 2, загрузить): перетаскиваешь `photo-france.jpg` на зону загрузки
приложения. Показываешь короткое «Reading your invoice», затем заполненную форму
Review. Медленно скроллишь поля: продавец, покупатель, VAT, строки, итоги. Обрати
внимание на зелёный баннер «meets the EN 16931 checks».

Говоришь (EN):
> "I drop it into InvoiceReady. The AI reads it straight from the image. Seller,
> buyer, VAT numbers, line items, totals. And it already checked everything
> against the European standard, EN 16931. The banner is green. It is compliant.
> Here is the key idea: the AI only reads. Whether the invoice is legal is
> decided by deterministic rules, in code."

Примечание: если распознавание задержалось, не жди, вырежешь паузу в монтаже.
Если совсем нет сети, вместо перетаскивания нажми карточку «Photo of a paper
invoice» (форма откроется мгновенно) и убери из реплики слова «straight from the
image».

## Сцена 3. Результат и стандарты (1:20 to 1:55)

На экране: нажимаешь «Generate e-invoice». Экран Done с зелёным бейджем. Жмёшь
«Download UBL XML» (покажи, что файл скачался). Переключаешься на вкладку «UBL
XML», чуть скроллишь XML.

Говоришь (EN):
> "Now I download a real e-invoice. UBL, the Peppol standard. Every invoice we
> generate passes the official EN 16931 and Peppol validators with zero errors.
> No ERP, no setup, and the file never leaves the browser. Privacy is built in."

## Сцена 4. Финал (1:55 to 2:15)

На экране: возвращаешься на лендинг или показываешь последний слайд презентации
(`/deck.html`, стрелками до конца). Покажи адрес на экране.

Говоришь (EN):
> "Any invoice in. A compliant European e-invoice out. In thirty seconds.
> InvoiceReady."

Покажи на экране адрес: invoiceready-air-slate.vercel.app

---

## Чек-лист прогонки (прогнать путь один раз до записи)

- [ ] Браузер в тёмной теме, 1080p, чистое окно, уведомления выключены.
- [ ] Лендинг грузится, видно свечение фона и три карточки со статистикой.
- [ ] `photo-france.jpg` открывается в просмотре и хорошо виден.
- [ ] Перетаскивание файла запускает распознавание, форма заполняется корректно.
- [ ] Баннер в Review зелёный (invoice compliant).
- [ ] «Generate e-invoice» открывает экран Done с бейджем.
- [ ] «Download UBL XML» скачивает файл, вкладка XML показывает настоящий UBL.
- [ ] Общая длительность до 5:00, лучше около 2:15.

## Запись и монтаж

Рекомендуемый способ: записывай экран и голос вместе в один проход. Голос и
картинка сразу синхронны, ничего склеивать не надо.

- Открой телесуфлёр `public/demo-script.html` на втором экране или телефоне и
  читай крупные блоки «Говоришь» прямо с него.
- Запись: QuickTime Player, File, New Screen Recording (или Cmd+Shift+5). В
  Options выбери микрофон, чтобы голос писался вместе с экраном.
- Сделай 2 to 3 дубля всего ролика, выбери лучший. Паузы ожидания сети потом
  подрежешь.

Если целиком не получается, пиши по сценам: каждую сцену отдельным клипом с
голосом, затем состыкуй клипы встык в iMovie (перетащи на таймлайн в нужном
порядке, синхронизировать ничего не нужно) и экспортируй.

- Простой монтаж в iMovie: New Project, Movie; перетащи клипы по порядку;
  подрежь лишнее по краям; при желании добавь титульный кадр и финальный слайд
  презентации как концовку; File, Share, File для экспорта.
- Экспорт: 1080p, mp4 (H.264). Залей туда, куда требует портал конкурса.
- Длительность: около 2:15. Сцены 2 и 3 обязательны, их не режь.
