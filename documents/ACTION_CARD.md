ActionCardの見た目を見直します。

- 現在、Skillが青色、Attackが赤色、状態異常が黒色ですが、SkillとAttackはクリーム色、状態異常は赤色にしてください
- 使用可能なカードは、カードのふちがマナと同じ黄色になり、仕えないカードは灰色になるようにしてください


# card-trash 
card-trashと deck-drawの演出の見た目が変なので、考えなおします。
ダミーカードを使うのはやめましょう。縮小は諦めて、実際のカードがフェードイン／フェードアウトしながら、山札や捨て札の位置と手札の間を移動するようにしてください。

原因は、浮遊用カードの座標計算・サイズ取得に ActionCard 本体ではなく hand-card-wrapper の div を参照している点です。registerCardElement を wrapper (<div class="hand-card-wrapper">) に付けているため、getBoundingClientRect() が返す幅は --card-width (=150px) で、実際の ActionCard（幅94px）より大きい値になります。その値をそのまま hand-floating-card の width/height として使っているので、浮遊中の ActionCard は 150px 幅に拡大され、実カードより一回り大きく見えています。