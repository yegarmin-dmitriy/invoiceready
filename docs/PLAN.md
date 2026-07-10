# InvoiceReady — AI Build Day (24h, соло)

## Context

Хакатон стартовал (бриф открыт, git freeze сб 11.07 07:00 Warsaw). Выбрана идея **InvoiceReady**: конвертер любого инвойса (PDF/скан/фото) в компланетный EU e-invoice (EN 16931 / UBL 2.1) с человекочитаемой валидацией. Боль: мандаты e-invoicing в ЕС (Польша KSeF, Бельгия, Франция 2026+) затрагивают 10M+ SMB, у которых нет ERP — их инвойсы из Word/Excel юридически перестают существовать. Аудитория = аудитория airSlate → заявки на Best Business Idea / Most Practical. Скоуп MVP: общеевропейский EN 16931 (UBL), без национальных форматов.

Питч: **"Turn any invoice — even a photo — into a legally compliant EU e-invoice in 30 seconds."** Категория: Product. Всё на английском.

## Шаг 0 — ресурсы (руками Dmytro, прямо сейчас)

1. Портал → создать **team repo** (company org). Склонировать в `~/Projects/hackathon/invoiceready`.
2. Портал → запросить **LiteLLM-бюджет ~$50** (продукт вызывает Claude vision в runtime).
3. Портал → запросить **Vercel-аккаунт** (email+пароль появятся в портале).
4. Первый Update в ленту: идея + питч.

## Архитектура

- **Next.js (App Router, TypeScript) на Vercel**, stateless, без БД и auth. Файлы не сохраняются (privacy = фича).
- **API route `/api/extract`**: принимает файл (PDF/изображение) → Claude vision через LiteLLM endpoint (OpenAI-compatible; ключ и base URL в env Vercel, не в коде) → structured JSON по схеме инвойса (seller, buyer, VAT ids, dates, lines[], totals, currency, tax breakdown).
- **Модуль `lib/validate.ts`**: детерминированная проверка подмножества бизнес-правил EN 16931 — обязательные поля (BR-01..BR-16 и ко), арифметика (sum(lines)=net, net+VAT=gross, ставки согласованы), формат VAT-id. Возвращает список issues {severity, field, humanMessage}. AI в валидации не участвует.
- **Модуль `lib/ubl.ts`**: детерминированная генерация UBL 2.1 Invoice XML (EN 16931 profile, CustomizationID Peppol BIS 3.0) из провалидированного JSON.
- **UI одностраничный, 3 состояния**: Drop (drag&drop + «Try a sample» с 3 встроенными примерами) → Review (форма с полями, подсветка issues по-человечески, инлайн-редактирование) → Done (бейдж compliant, скачать XML, человекочитаемый предпросмотр инвойса).
- Sample-инвойсы: 3 синтетических (чистый PDF, «кривой» с ошибками, фото бумажного) — сгенерить на месте, никаких реальных данных компании.

## Тайм-план (вехи из BATTLE-PLAN.md)

- **до 10:00** — репо, скелет Next.js, деплой на Vercel, live URL, Update #2.
- **до 14:00** — extract (vision→JSON) + генерация UBL XML работают end-to-end на sample.
- **до 19:00 (открытие голосования)** — валидация с человеческими сообщениями, Review-форма, samples, приличный вид. Большой Update со скриншотами и URL.
- **19:00–00:00** — полировка UI (Best Design), edge-кейсы (фото, многостраничные), предпросмотр, лендинг-шапка с объяснением проблемы.
- **03:00 freeze** → **05:00–06:30** демо-видео ≤5 мин (EN, S3) + HTML-презентация (EN, Factum) → **06:30 сабмит** (My Project: pitch, категория Product).

## Правила по ходу

- Коммит после каждого работающего куска, деплой непрерывно, Updates каждые ~2ч.
- Никаких секретов в коде (env vars), никаких конфиденциальных данных в промптах и samples.
- Логи AI-сессий и git-история сохраняются (спот-чек топ-10).

## Verification

- E2E на live URL: загрузить каждый из 3 samples → извлечение корректно, issues осмысленные, XML скачивается.
- Валидность XML: прогнать сгенерированный UBL через открытый валидатор EN 16931 (например, ecosio/Peppol online validator) — вручную перед freeze.
- «Кривой» sample показывает 🔴/🟡 сообщения и чинится инлайн-редактированием до зелёного.
- Демо-путь (фото → XML) прогнать дважды перед записью видео.
