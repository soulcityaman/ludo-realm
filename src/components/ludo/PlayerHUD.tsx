import { memo } from "react";
import type { CSSProperties } from "react";
import type { PlayerColor } from "@/lib/game/constants";
import { COLOR_HEX, TOKENS_PER_PLAYER } from "@/lib/game/constants";
import type { PlayerState } from "@/lib/game/logic";
import { isFinished } from "@/lib/game/logic";
interface PlayerHUDProps { player: PlayerState; isActive: boolean; timerPercent: number; isCurrentTurn: boolean; isMe?: boolean; }
const TOKEN_SHAPES=["●","◆","▲","■"];
const PlayerHUD=memo(function PlayerHUD({player,timerPercent,isCurrentTurn,isMe=false}:PlayerHUDProps){
 const hex=COLOR_HEX[player.color]; const finishedCount=player.tokens.filter(t=>isFinished(t.position)).length;
 return <section className={`player-hud ${isCurrentTurn?"player-hud-active":""}`} style={{"--player-color":hex.base,"--player-light":hex.light,"--player-track":hex.track} as CSSProperties} aria-label={`${player.name}${isCurrentTurn?", current turn":""}`}>
  <div className="player-avatar">{player.name.charAt(0).toUpperCase()}</div><div className="player-copy"><div className="player-name-row"><strong>{player.name}</strong>{isMe&&<span className="hud-pill">YOU</span>}{isCurrentTurn&&<span className="hud-pill hud-pill-live">LIVE</span>}</div>
  <div className="token-dots" aria-label={`${finishedCount} of ${TOKENS_PER_PLAYER} tokens home`}>{Array.from({length:TOKENS_PER_PLAYER}).map((_,i)=>{const token=player.tokens[i],done=isFinished(token.position),home=token.position===-1;return <span key={i} style={{color:done?hex.base:home?"#4d5262":hex.dark,opacity:home?.45:1}}>{TOKEN_SHAPES[i]}</span>})}</div></div>
  <div className="player-stats"><span>{player.captures} captures</span><strong>{finishedCount}/{TOKENS_PER_PLAYER}</strong></div>
  {isCurrentTurn&&<div className="turn-progress-track"><div className="turn-progress" style={{width:`${timerPercent}%`,background:hex.base}}/></div>}
 </section>;
});
export default PlayerHUD;
