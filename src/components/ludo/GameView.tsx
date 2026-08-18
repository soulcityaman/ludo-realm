import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import LudoBoard from "./LudoBoard";
import DiceRoller from "./DiceRoller";
import PlayerHUD from "./PlayerHUD";
import VictoryScreen from "./VictoryScreen";
import GameStatusPanel from "./GameStatusPanel";
import { type PlayerColor, TWO_PLAYER_COLORS, TURN_TIME_LIMIT } from "@/lib/game/constants";
import { createInitialState, rollDice, moveToken, autoSkipTurn, currentPlayer, type GameState } from "@/lib/game/logic";

interface GameViewProps { roomId: Id<"rooms">; roomCode: string; playerNames: Record<PlayerColor,string>; myColor: PlayerColor; isHost: boolean; onLeave: () => void; }
let audioContext: AudioContext|null=null;
function playTone(type:"roll"|"move"|"capture"|"win",enabled:boolean){if(!enabled||typeof window==="undefined")return;try{audioContext??=new AudioContext();const ctx=audioContext;if(ctx.state==="suspended")void ctx.resume();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain).connect(ctx.destination);const config={roll:[440,.08,"sine"],move:[560,.06,"sine"],capture:[240,.08,"triangle"],win:[720,.1,"sine"]} as const;const [frequency,volume,wave]=config[type];osc.type=wave;osc.frequency.value=frequency;gain.gain.setValueAtTime(volume,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+(type==="win"?.45:.16));osc.start();osc.stop(ctx.currentTime+(type==="win"?.45:.16));}catch{/* optional audio */}}

export default function GameView({roomId,roomCode,playerNames,myColor,onLeave}:GameViewProps){
 const room=useQuery(api.rooms.getById,{roomId}); const updateGameState=useMutation(api.rooms.updateGameState); const endGame=useMutation(api.rooms.endGame);
 const [timerPercent,setTimerPercent]=useState(100); const [soundEnabled,setSoundEnabled]=useState(true); const [eventMessage,setEventMessage]=useState<string|null>(null); const [optimisticState,setOptimisticState]=useState<GameState|null>(null);
 const skipRef=useRef<(()=>void)|null>(null); const syncInFlight=useRef(false); const pendingState=useRef<GameState|null>(null);
 const gameState=optimisticState??(room?.gameState as GameState|undefined)??null; const activePlayer=gameState?currentPlayer(gameState):null; const isMyTurn=activePlayer?.color===myColor; const opponentColor=TWO_PLAYER_COLORS.find(c=>c!==myColor)??"yellow";
 const myPlayer=gameState?.players.find(p=>p.color===myColor)??null; const opponentPlayer=gameState?.players.find(p=>p.color===opponentColor)??null; const myPlayerIndex=gameState?.players.findIndex(p=>p.color===myColor)??-1; const opponentPlayerIndex=gameState?.players.findIndex(p=>p.color===opponentColor)??-1;
 const syncLatest=useCallback(async(next:GameState)=>{
  pendingState.current=next; setOptimisticState(next); if(syncInFlight.current)return; syncInFlight.current=true;
  try{while(pendingState.current){const stateToSend=pendingState.current;pendingState.current=null;await updateGameState({roomId,gameState:stateToSend});if(pendingState.current===null)setOptimisticState(null)}}catch(error){console.error("Failed to sync game state",error)}finally{syncInFlight.current=false;if(pendingState.current)void syncLatest(pendingState.current)}
 },[roomId,updateGameState]);
 skipRef.current=()=>{if(!gameState||!isMyTurn)return;void syncLatest(autoSkipTurn(gameState))};
 useEffect(()=>{if(!gameState||!isMyTurn||gameState.phase==="finished")return;setTimerPercent(100);const start=performance.now();let lastBucket=-1,frame=0;const tick=(now:number)=>{const elapsed=now-start,percent=Math.max(0,100-(elapsed/(TURN_TIME_LIMIT*1000))*100),bucket=Math.floor(elapsed/250);if(bucket!==lastBucket){lastBucket=bucket;setTimerPercent(percent)}if(percent<=0)skipRef.current?.();else frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[gameState?.currentPlayerIndex,gameState?.turnStartTime,gameState?.phase,isMyTurn]);
 useEffect(()=>{if(!gameState?.lastEvent)return;setEventMessage(gameState.lastEvent);const timeout=window.setTimeout(()=>setEventMessage(null),2600);return()=>window.clearTimeout(timeout)},[gameState?.lastEvent,gameState?.moveHistory.length]);
 const handleRoll=useCallback(async()=>{if(!gameState||!isMyTurn||gameState.phase!=="rolling")return;playTone("roll",soundEnabled);await syncLatest(rollDice(gameState))},[gameState,isMyTurn,syncLatest,soundEnabled]);
 const handleTokenClick=useCallback(async(playerIndex:number,tokenIndex:number)=>{if(!gameState||!isMyTurn)return;const player=gameState.players[playerIndex];if(!player||player.color!==myColor||!gameState.movableTokens.includes(tokenIndex))return;const next=moveToken(gameState,tokenIndex),lastMove=next.moveHistory[next.moveHistory.length-1];playTone(lastMove?.captured?"capture":"move",soundEnabled);if(next.winner){playTone("win",soundEnabled);try{await endGame({roomId,winnerColor:next.winner})}catch(error){console.error(error)}}await syncLatest(next)},[gameState,isMyTurn,myColor,roomId,endGame,syncLatest,soundEnabled]);
 const handleRematch=useCallback(async()=>{await syncLatest(createInitialState(TWO_PLAYER_COLORS,playerNames));setTimerPercent(100)},[playerNames,syncLatest]);
 if(!gameState||!activePlayer||!myPlayer||!opponentPlayer)return <div className="game-loading"><div className="loading-orb"/><span>Synchronizing match…</span></div>;
 return <main className="game-shell"><header className="game-topbar"><button className="topbar-action" onClick={onLeave} type="button">← <span>Leave</span></button><div className="brand-lockup"><span className="brand-mark">✦</span><div><strong>LUDO REALM</strong><small>PRIVATE MATCH · {roomCode}</small></div></div><button className="topbar-action sound-toggle" onClick={()=>setSoundEnabled(v=>!v)} type="button" aria-label="Toggle sound">{soundEnabled?"◉":"○"}<span>{soundEnabled?"Sound":"Muted"}</span></button></header>
  <div className="game-layout"><section className="game-arena"><div className="turn-banner" data-active={isMyTurn}><span className="status-pulse"/><div><small>{isMyTurn?"YOUR TURN":"OPPONENT TURN"}</small><strong>{isMyTurn?"Make your move":`${opponentPlayer.name} is playing`}</strong></div><span className="turn-countdown">{Math.ceil((timerPercent/100)*TURN_TIME_LIMIT)}s</span></div>
   <div className="player-slot player-slot-top"><PlayerHUD player={opponentPlayer} isActive={gameState.currentPlayerIndex===opponentPlayerIndex} timerPercent={gameState.currentPlayerIndex===opponentPlayerIndex?timerPercent:0} isCurrentTurn={gameState.currentPlayerIndex===opponentPlayerIndex}/></div>
   <div className="board-frame"><div className="board-glow" style={{background:`radial-gradient(circle,${activePlayer.color==="red"?"rgba(255,85,100,.2)":"rgba(255,210,65,.18)"},transparent 65%)`}}/><LudoBoard players={gameState.players} movableTokens={isMyTurn?gameState.movableTokens:[]} currentPlayerColor={activePlayer.color} onTokenClick={handleTokenClick}/></div>
   <div className="player-slot player-slot-bottom"><PlayerHUD player={myPlayer} isActive={gameState.currentPlayerIndex===myPlayerIndex} timerPercent={gameState.currentPlayerIndex===myPlayerIndex?timerPercent:0} isCurrentTurn={gameState.currentPlayerIndex===myPlayerIndex} isMe/></div>
   <div className="game-controls"><AnimatePresence mode="wait">{eventMessage&&<motion.div key={eventMessage} className="event-toast" initial={{opacity:0,y:8,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8}}>{eventMessage}</motion.div>}</AnimatePresence><DiceRoller diceValue={gameState.diceValue} canRoll={gameState.phase==="rolling"&&!gameState.hasRolled&&isMyTurn} playerColor={activePlayer.color} onRoll={handleRoll}/>{gameState.phase==="moving"&&gameState.movableTokens.length>1&&isMyTurn&&<p className="move-hint">Choose one of the glowing pieces</p>}</div>
  </section><GameStatusPanel gameState={gameState} playerNames={playerNames}/></div>{gameState.winner&&<VictoryScreen winner={gameState.winner} gameState={gameState} onRematch={handleRematch} onLeave={onLeave}/>}</main>;
}
