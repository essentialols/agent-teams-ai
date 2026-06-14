export function composeCodexPrompt(input) {
    const systemPrompt = input.systemPrompt?.trim();
    if (!systemPrompt)
        return input.prompt;
    return [
        "System instructions:",
        systemPrompt,
        "",
        "User task:",
        input.prompt,
    ].join("\n");
}
//# sourceMappingURL=codex-prompt-composer.js.map