# Audio Tools

効果音ファイルを追加した際は、以下の手順で音量ノーマライズと無音カットを行います。

## 1. ffmpeg の準備
- `ffmpeg` コマンドが使用できる環境を用意してください（macOS / Linux 推奨）。

## 2. ノーマライズ + 無音カット
```bash
# 例: input.wav を処理して output.wav を生成
ffmpeg -i input.wav \
  -af "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.1, loudnorm=I=-16:LRA=11:TP=-1.5" \
  output.wav
```
- `silenceremove` で先頭の無音区間を削除
- `loudnorm` でターゲット -16 LUFS / -1.5 dB TP に揃える

## 3. プロジェクトへの配置
- `materials/sounds/<category>/` 以下に配置し、SOUND.md の対応表に追記します。
- コミット前に `/demo/damage-effects` で再生確認を行ってください。
```
