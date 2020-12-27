// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

new Text: g_driftGoodTextDraw;
new Text: g_driftGreatTextDraw;
new Text: g_driftExcellentTextDraw;

new PlayerText: g_driftPlayerLabelTextDraw[MAX_PLAYERS];
new PlayerText: g_driftPlayerTotalScoreTextDraw[MAX_PLAYERS];

InitializeDriftTextDraws() {
    g_driftGoodTextDraw = TextDrawCreate(266, 107, "Good Drift");
    TextDrawBackgroundColor(g_driftGoodTextDraw, 255);
    TextDrawFont(g_driftGoodTextDraw, 2);
    TextDrawLetterSize(g_driftGoodTextDraw, 0.370000, 2.100000);
    TextDrawColor(g_driftGoodTextDraw, 16777215);
    TextDrawSetOutline(g_driftGoodTextDraw, 0);
    TextDrawSetProportional(g_driftGoodTextDraw, 1);
    TextDrawSetShadow(g_driftGoodTextDraw, 1);

    g_driftGreatTextDraw = TextDrawCreate(266, 107, "Great drift!");
    TextDrawBackgroundColor(g_driftGreatTextDraw, 255);
    TextDrawFont(g_driftGreatTextDraw, 2);
    TextDrawLetterSize(g_driftGreatTextDraw, 0.370000, 2.100000);
    TextDrawColor(g_driftGreatTextDraw, COLOR_YELLOW);
    TextDrawSetOutline(g_driftGreatTextDraw, 0);
    TextDrawSetProportional(g_driftGreatTextDraw, 1);
    TextDrawSetShadow(g_driftGreatTextDraw, 1);

    g_driftExcellentTextDraw = TextDrawCreate(266, 107, "Excellent Drift!!");
    TextDrawBackgroundColor(g_driftExcellentTextDraw, 255);
    TextDrawFont(g_driftExcellentTextDraw, 2);
    TextDrawLetterSize(g_driftExcellentTextDraw, 0.370000, 2.100000);
    TextDrawColor(g_driftExcellentTextDraw, COLOR_LIGHTBLUE);
    TextDrawSetOutline(g_driftExcellentTextDraw, 0);
    TextDrawSetProportional(g_driftExcellentTextDraw, 1);
    TextDrawSetShadow(g_driftExcellentTextDraw, 1);
}

InitializePlayerDriftTextDraws(playerId) {
    g_driftPlayerLabelTextDraw[playerId] = CreatePlayerTextDraw(playerId, 41, 220, "DRIFTING");
    PlayerTextDrawBackgroundColor(playerId, g_driftPlayerLabelTextDraw[playerId], 255);
    PlayerTextDrawFont(playerId, g_driftPlayerLabelTextDraw[playerId], 1);
    PlayerTextDrawLetterSize(playerId, g_driftPlayerLabelTextDraw[playerId], 0.34, 1.3);
    PlayerTextDrawColor(playerId, g_driftPlayerLabelTextDraw[playerId], -1);
    PlayerTextDrawSetOutline(playerId, g_driftPlayerLabelTextDraw[playerId], 0);
    PlayerTextDrawSetProportional(playerId, g_driftPlayerLabelTextDraw[playerId], 1);
    PlayerTextDrawSetShadow(playerId, g_driftPlayerLabelTextDraw[playerId], 1);
    PlayerTextDrawUseBox(playerId, g_driftPlayerLabelTextDraw[playerId], 1);
    PlayerTextDrawBoxColor(playerId, g_driftPlayerLabelTextDraw[playerId], 255);
    PlayerTextDrawTextSize(playerId, g_driftPlayerLabelTextDraw[playerId], 98.0, 0.0);

    g_driftPlayerTotalScoreTextDraw[playerId] = CreatePlayerTextDraw(playerId, 41, 236, "0");
    PlayerTextDrawBackgroundColor(playerId, g_driftPlayerTotalScoreTextDraw[playerId], -1);
    PlayerTextDrawFont(playerId, g_driftPlayerTotalScoreTextDraw[playerId], 1);
    PlayerTextDrawLetterSize(playerId, g_driftPlayerTotalScoreTextDraw[playerId], 0.32, 1.5);
    PlayerTextDrawColor(playerId, g_driftPlayerTotalScoreTextDraw[playerId], 255);
    PlayerTextDrawSetOutline(playerId, g_driftPlayerTotalScoreTextDraw[playerId], 1);
    PlayerTextDrawSetProportional(playerId, g_driftPlayerTotalScoreTextDraw[playerId], 1);
    PlayerTextDrawUseBox(playerId, g_driftPlayerTotalScoreTextDraw[playerId], 1);
    PlayerTextDrawBoxColor(playerId, g_driftPlayerTotalScoreTextDraw[playerId], 0x00000033);
    PlayerTextDrawTextSize(playerId, g_driftPlayerTotalScoreTextDraw[playerId], 98.0, 0.0);
}

ShowDriftingUiForPlayer(playerId) {
    PlayerTextDrawSetString(playerId, g_driftPlayerTotalScoreTextDraw[playerId], "0");

    PlayerTextDrawShow(playerId, g_driftPlayerLabelTextDraw[playerId]);
    PlayerTextDrawShow(playerId, g_driftPlayerTotalScoreTextDraw[playerId]);
}

UpdateDriftingUiForPlayer(playerId, score) {
    new scoreString[16];
    format(scoreString, sizeof(scoreString), "%d", score);

    PlayerTextDrawSetString(playerId, g_driftPlayerTotalScoreTextDraw[playerId], scoreString);
    PlayerTextDrawShow(playerId, g_driftPlayerTotalScoreTextDraw[playerId]);
}

HideDriftingUiForPlayer(playerId) {
    PlayerTextDrawHide(playerId, g_driftPlayerLabelTextDraw[playerId]);
    PlayerTextDrawHide(playerId, g_driftPlayerTotalScoreTextDraw[playerId]);
}

DestroyPlayerDriftTextDraws(playerId) {
    PlayerTextDrawDestroy(playerId, g_driftPlayerLabelTextDraw[playerId]);
    PlayerTextDrawDestroy(playerId, g_driftPlayerTotalScoreTextDraw[playerId]);
}
