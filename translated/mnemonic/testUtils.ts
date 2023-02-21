import type {Transcript} from '../merlin/transcript'
import type {Transcript as TranscriptMax} from '../../src/external/merlin'

export const formatNumbers = (numbers: number[] | Uint8Array): string => {
  let output = ''
  for (let i = 0; i < numbers.length; i++) {
    output += numbers[i].toString() + ','
    if ((i + 1) % 16 === 0) {
      output += '\n'
    }
  }
  return output
}
export const printTranscript = (transcript: Transcript) => {
  const strobe = transcript.cloneStrobe().clone().cloneState()
  console.log('state', formatNumbers(strobe.state))
  console.log('pos', strobe.pos)
  console.log('pos_begin', strobe.pos_begin)
  console.log('cur_flags', strobe.cur_flags)
}

export const printTranscriptMax = (transcript: TranscriptMax) => {
  const strobe = transcript.GetStrobe()
  console.log('state', formatNumbers(strobe.state))
  console.log('pos', strobe.pos)
  console.log('pos_begin', strobe.posBegin)
  console.log('cur_flags', strobe.curFlags)
}
