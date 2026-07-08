# ChatGPT Clean Markdown Exporter

Lekki userscript do Tampermonkey/Violentmonkey, który eksportuje pojedynczą rozmowę ChatGPT do czystego, tekstowego Markdowna.

Narzędzie powstało dla pracy mobilnej i terenowej: kiedy eksport rozmowy puchnie przez obrazy Base64, telefon dostaje zadyszki, edytory Markdown się dławią, a cały workflow zaczyna przypominać walkę z hydrą.

## Po co to istnieje

Niektóre eksportery ChatGPT zachowują obrazy przez osadzanie ich bezpośrednio w Markdownie jako `data:image` / Base64. To bywa dobre dla archiwum, ale jest fatalne, gdy potrzebujesz małego pliku tekstowego do NotebookLM, Obsidiana, Claude, Gemini albo dalszej analizy przez modele językowe.

Ten skrypt robi odwrotnie:

- zostawia tekst rozmowy;
- zostawia prostą strukturę wypowiedzi;
- nie pobiera obrazów;
- nie osadza Base64;
- zamienia obrazy i nieobsługiwane media na czytelne placeholdery.

## Funkcje

- Eksport aktualnej rozmowy ChatGPT do pliku `.md`.
- Pływający przycisk `MD` w interfejsie ChatGPT.
- Komenda w menu Tampermonkey: `Export Clean Markdown`.
- Proste nagłówki: `#### You:` i `#### ChatGPT:`.
- Obrazy użytkownika są zastępowane przez `[IMAGE REMOVED: user-upload]`.
- Obrazy wygenerowane są zastępowane przez `[IMAGE REMOVED: generated-image]`.
- Zwykły tekst i zwykłe linki zostają.
- Bez `data:image`.
- Bez Base64.
- Bez pobierania `sediment://`.
- Bez JSZip.
- Bez html2canvas.
- Bez zewnętrznych `@require`.

## Instalacja

1. Zainstaluj Tampermonkey albo Violentmonkey w przeglądarce.
2. Otwórz `ChatGPT-Clean-Markdown-Exporter.user.js`.
3. Zainstaluj userscript.
4. Otwórz konkretną rozmowę ChatGPT.
5. Kliknij pływający przycisk `MD` albo użyj menu userscriptu.

## Uwagi przeglądarkowe

Skrypt jest projektowany pod:

- desktopowe przeglądarki z Tampermonkey/Violentmonkey;
- Firefox na Androidzie z Tampermonkey, gdzie małe eksporty są szczególnie przydatne.

ChatGPT jest szybko zmieniającą się aplikacją webową. Jeżeli OpenAI zmieni wewnętrzne API albo obsługę sesji, skrypt może wymagać aktualizacji.

## Model bezpieczeństwa

Skrypt:

- działa tylko na `chatgpt.com` i `chat.openai.com`;
- nie ma zewnętrznych zależności;
- nie wysyła rozmów na zewnętrzne serwery;
- korzysta z aktualnej zalogowanej sesji ChatGPT, żeby pobrać bieżącą rozmowę z ChatGPT;
- tworzy lokalny plik Markdown przez mechanizm pobierania w przeglądarce.

## Filozofia outputu

To nie jest eksporter archiwalny pełnej wierności. To jest lekki eksporter terenowy: tekst przede wszystkim, blobom wstęp wzbroniony.

Do plików, które już spuchły od Base64, użyj osobnego oczyszczacza, np. Blob Exorcist.

## Motto

> Ex chao Markdownico ordinem feci.  
> Facilius. Simplicius. Melius.

## Licencja

MIT License. Zobacz `LICENSE`.
