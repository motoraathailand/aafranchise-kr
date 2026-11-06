# Original synth beat generated from scratch (numpy), no samples or copyrighted audio. usage: python3 make_music.py <seconds>
import numpy as np, wave, sys
sr=44100; dur=float(sys.argv[1]); n=int(sr*dur); t=np.arange(n)/sr
bpm=118; beat=60/bpm
out=np.zeros(n)
def add(sig,start):
    i=int(start*sr)
    if i>=n: return
    j=min(n,i+len(sig)); out[i:j]+=sig[:j-i]
kt=np.arange(int(.25*sr))/sr
f=45+120*np.exp(-kt*28); kick=np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-kt*12)*0.9
rng=np.random.default_rng(3)
ht=np.arange(int(.05*sr))/sr; hat=rng.standard_normal(len(ht))*np.exp(-ht*90)*0.12
ct=np.arange(int(.15*sr))/sr; clap=rng.standard_normal(len(ct))*np.exp(-ct*30)*0.25
scale=[0,3,7,10,12,10,7,3]; root=220.0
b=0
while b*beat<dur:
    s=b*beat
    add(kick,s); add(hat,s+beat/2)
    if b%2==1: add(clap,s)
    bt=np.arange(int(beat*.45*sr))/sr; bn=[0,0,-4,-2][(b//4)%4]
    add(np.sin(2*np.pi*(root/4)*2**(bn/12)*bt)*np.exp(-bt*5)*0.35, s+beat/2)
    for h in range(2):
        k=scale[(b*2+h)%len(scale)]+bn
        pt=np.arange(int(beat*.5*sr))/sr; fq=root*2**(k/12)
        add((np.sin(2*np.pi*fq*pt)+.4*np.sin(4*np.pi*fq*pt))*np.exp(-pt*9)*0.16,s+h*beat/2)
    b+=1
out*=np.minimum(1,t/0.05)*np.minimum(1,(dur-t)/1.2)
out=out/np.max(np.abs(out))*0.8
w=wave.open('/workspace/fr/promo-src/music.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((out*32767).astype(np.int16).tobytes()); w.close()
