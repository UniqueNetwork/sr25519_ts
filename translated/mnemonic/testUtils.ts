import type {Transcript} from '../merlin/transcript'

export const formatNumbers = (numbers: number[] | Uint8Array): string => {
  let output = '';
  for (let i = 0; i < numbers.length; i++) {
    output += numbers[i] + ',';
    if ((i + 1) % 16 === 0) {
      output += '\n';
    }
  }
  return output;
}
export const printTranscript = (transcript: Transcript) => {
  const strobe = transcript.cloneStrobe().clone().cloneState()
  console.log('state', formatNumbers(strobe.state))
  console.log('pos', strobe.pos)
  console.log('pos_begin', strobe.pos_begin)
  console.log('cur_flags', strobe.cur_flags)
}
