export const enum StateCode {
  SUCCESS = "SUCCESS",
  FILD = "FILD",
  WARN = "WARN",
  ERROR = "ERROR",
}

export const encodeStateCode: { [key: string]: number } = {
  SUCCESS: 0,
  FILD: 1,
  WARN: 2,
  ERROR: 3,
};

export const decodeStateCode: { [key: number]: StateCode } = {
  0: StateCode.SUCCESS,
  1: StateCode.FILD,
  2: StateCode.WARN,
  3: StateCode.ERROR,
};

export const enum Part {
  UNKNOW = "UNKNOW",
  HAIR = "HAIR",
  BODY_TOP = "BODY_TOP",
  BODY_BOTTOM = "BODY_BOTTOM",
  LEFT_HAND = "LEFT_HAND",
  RIGHT_HAND = "RIGHT_HAND",
  FEET = "FEET",
  HEAD = "HEAD",
  EYE = "EYE",
  MOUTH = "MOUTH",
  MAKEUP = "MAKEUP",
  FACE = "FACE",
  ORNAMENT = "ORNAMENT",
  PET = "PET",
  JEWEL = "JEWEL",
  WING = "WING",
}

export const encodePart: { [key: string]: number } = {
  UNKNOW: 0,
  HAIR: 1,
  BODY_TOP: 2,
  BODY_BOTTOM: 3,
  LEFT_HAND: 4,
  RIGHT_HAND: 5,
  FEET: 6,
  HEAD: 7,
  EYE: 8,
  MOUTH: 9,
  MAKEUP: 10,
  FACE: 11,
  ORNAMENT: 12,
  PET: 13,
  JEWEL: 14,
  WING: 15,
};

export const decodePart: { [key: number]: Part } = {
  0: Part.UNKNOW,
  1: Part.HAIR,
  2: Part.BODY_TOP,
  3: Part.BODY_BOTTOM,
  4: Part.LEFT_HAND,
  5: Part.RIGHT_HAND,
  6: Part.FEET,
  7: Part.HEAD,
  8: Part.EYE,
  9: Part.MOUTH,
  10: Part.MAKEUP,
  11: Part.FACE,
  12: Part.ORNAMENT,
  13: Part.PET,
  14: Part.JEWEL,
  15: Part.WING,
};

export const enum AttributeType {
  NULL = "NULL",
  ATTACK = "ATTACK",
  DEFENSE = "DEFENSE",
  CRIT = "CRIT",
}

export const encodeAttributeType: { [key: string]: number } = {
  NULL: 0,
  ATTACK: 1,
  DEFENSE: 2,
  CRIT: 3,
};

export const decodeAttributeType: { [key: number]: AttributeType } = {
  0: AttributeType.NULL,
  1: AttributeType.ATTACK,
  2: AttributeType.DEFENSE,
  3: AttributeType.CRIT,
};

export interface BaseRequest {
  cmd?: number;
  identity?: string;
  pack?: Uint8Array;
}

export function encodeBaseRequest(message: BaseRequest): Uint8Array {
  let bb = popByteBuffer();
  _encodeBaseRequest(message, bb);
  return toUint8Array(bb);
}

function _encodeBaseRequest(message: BaseRequest, bb: ByteBuffer): void {
  // optional int32 cmd = 1;
  let $cmd = message.cmd;
  if ($cmd !== undefined) {
    writeVarint32(bb, 8);
    writeVarint64(bb, intToLong($cmd));
  }

  // optional string identity = 2;
  let $identity = message.identity;
  if ($identity !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $identity);
  }

  // optional bytes pack = 3;
  let $pack = message.pack;
  if ($pack !== undefined) {
    writeVarint32(bb, 26);
    writeVarint32(bb, $pack.length), writeBytes(bb, $pack);
  }
}

export function decodeBaseRequest(binary: Uint8Array): BaseRequest {
  return _decodeBaseRequest(wrapByteBuffer(binary));
}

function _decodeBaseRequest(bb: ByteBuffer): BaseRequest {
  let message: BaseRequest = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int32 cmd = 1;
      case 1: {
        message.cmd = readVarint32(bb);
        break;
      }

      // optional string identity = 2;
      case 2: {
        message.identity = readString(bb, readVarint32(bb));
        break;
      }

      // optional bytes pack = 3;
      case 3: {
        message.pack = readBytes(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface BaseResponseGroup {
  cmd?: number;
  state_code?: StateCode;
  packs?: BaseResponse[];
}

export function encodeBaseResponseGroup(message: BaseResponseGroup): Uint8Array {
  let bb = popByteBuffer();
  _encodeBaseResponseGroup(message, bb);
  return toUint8Array(bb);
}

function _encodeBaseResponseGroup(message: BaseResponseGroup, bb: ByteBuffer): void {
  // optional int32 cmd = 1;
  let $cmd = message.cmd;
  if ($cmd !== undefined) {
    writeVarint32(bb, 8);
    writeVarint64(bb, intToLong($cmd));
  }

  // optional StateCode state_code = 2;
  let $state_code = message.state_code;
  if ($state_code !== undefined) {
    writeVarint32(bb, 16);
    writeVarint32(bb, encodeStateCode[$state_code]);
  }

  // repeated BaseResponse packs = 3;
  let array$packs = message.packs;
  if (array$packs !== undefined) {
    for (let value of array$packs) {
      writeVarint32(bb, 26);
      let nested = popByteBuffer();
      _encodeBaseResponse(value, nested);
      writeVarint32(bb, nested.limit);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }
}

export function decodeBaseResponseGroup(binary: Uint8Array): BaseResponseGroup {
  return _decodeBaseResponseGroup(wrapByteBuffer(binary));
}

function _decodeBaseResponseGroup(bb: ByteBuffer): BaseResponseGroup {
  let message: BaseResponseGroup = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int32 cmd = 1;
      case 1: {
        message.cmd = readVarint32(bb);
        break;
      }

      // optional StateCode state_code = 2;
      case 2: {
        message.state_code = decodeStateCode[readVarint32(bb)];
        break;
      }

      // repeated BaseResponse packs = 3;
      case 3: {
        let limit = pushTemporaryLength(bb);
        let values = message.packs || (message.packs = []);
        values.push(_decodeBaseResponse(bb));
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface BaseResponse {
  cmd?: number;
  state_code?: StateCode;
  pack?: Uint8Array;
  info?: string;
  item_receive?: Item[];
}

export function encodeBaseResponse(message: BaseResponse): Uint8Array {
  let bb = popByteBuffer();
  _encodeBaseResponse(message, bb);
  return toUint8Array(bb);
}

function _encodeBaseResponse(message: BaseResponse, bb: ByteBuffer): void {
  // optional int32 cmd = 1;
  let $cmd = message.cmd;
  if ($cmd !== undefined) {
    writeVarint32(bb, 8);
    writeVarint64(bb, intToLong($cmd));
  }

  // optional StateCode state_code = 2;
  let $state_code = message.state_code;
  if ($state_code !== undefined) {
    writeVarint32(bb, 16);
    writeVarint32(bb, encodeStateCode[$state_code]);
  }

  // optional bytes pack = 3;
  let $pack = message.pack;
  if ($pack !== undefined) {
    writeVarint32(bb, 26);
    writeVarint32(bb, $pack.length), writeBytes(bb, $pack);
  }

  // optional string info = 4;
  let $info = message.info;
  if ($info !== undefined) {
    writeVarint32(bb, 34);
    writeString(bb, $info);
  }

  // repeated Item item_receive = 5;
  let array$item_receive = message.item_receive;
  if (array$item_receive !== undefined) {
    for (let value of array$item_receive) {
      writeVarint32(bb, 42);
      let nested = popByteBuffer();
      _encodeItem(value, nested);
      writeVarint32(bb, nested.limit);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }
}

export function decodeBaseResponse(binary: Uint8Array): BaseResponse {
  return _decodeBaseResponse(wrapByteBuffer(binary));
}

function _decodeBaseResponse(bb: ByteBuffer): BaseResponse {
  let message: BaseResponse = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int32 cmd = 1;
      case 1: {
        message.cmd = readVarint32(bb);
        break;
      }

      // optional StateCode state_code = 2;
      case 2: {
        message.state_code = decodeStateCode[readVarint32(bb)];
        break;
      }

      // optional bytes pack = 3;
      case 3: {
        message.pack = readBytes(bb, readVarint32(bb));
        break;
      }

      // optional string info = 4;
      case 4: {
        message.info = readString(bb, readVarint32(bb));
        break;
      }

      // repeated Item item_receive = 5;
      case 5: {
        let limit = pushTemporaryLength(bb);
        let values = message.item_receive || (message.item_receive = []);
        values.push(_decodeItem(bb));
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface Attribute {
  type?: AttributeType;
  value?: number;
  value2?: number;
}

export function encodeAttribute(message: Attribute): Uint8Array {
  let bb = popByteBuffer();
  _encodeAttribute(message, bb);
  return toUint8Array(bb);
}

function _encodeAttribute(message: Attribute, bb: ByteBuffer): void {
  // optional AttributeType type = 1;
  let $type = message.type;
  if ($type !== undefined) {
    writeVarint32(bb, 8);
    writeVarint32(bb, encodeAttributeType[$type]);
  }

  // optional int32 value = 2;
  let $value = message.value;
  if ($value !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($value));
  }

  // optional int32 value2 = 3;
  let $value2 = message.value2;
  if ($value2 !== undefined) {
    writeVarint32(bb, 24);
    writeVarint64(bb, intToLong($value2));
  }
}

export function decodeAttribute(binary: Uint8Array): Attribute {
  return _decodeAttribute(wrapByteBuffer(binary));
}

function _decodeAttribute(bb: ByteBuffer): Attribute {
  let message: Attribute = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional AttributeType type = 1;
      case 1: {
        message.type = decodeAttributeType[readVarint32(bb)];
        break;
      }

      // optional int32 value = 2;
      case 2: {
        message.value = readVarint32(bb);
        break;
      }

      // optional int32 value2 = 3;
      case 3: {
        message.value2 = readVarint32(bb);
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface Equip {
  part?: Part;
  name?: string;
  icon?: number;
  quality?: number;
  level?: number;
  attributes?: Attribute[];
  transformation?: number;
}

export function encodeEquip(message: Equip): Uint8Array {
  let bb = popByteBuffer();
  _encodeEquip(message, bb);
  return toUint8Array(bb);
}

function _encodeEquip(message: Equip, bb: ByteBuffer): void {
  // optional Part part = 1;
  let $part = message.part;
  if ($part !== undefined) {
    writeVarint32(bb, 8);
    writeVarint32(bb, encodePart[$part]);
  }

  // optional string name = 2;
  let $name = message.name;
  if ($name !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $name);
  }

  // optional int32 icon = 3;
  let $icon = message.icon;
  if ($icon !== undefined) {
    writeVarint32(bb, 24);
    writeVarint64(bb, intToLong($icon));
  }

  // optional int32 quality = 4;
  let $quality = message.quality;
  if ($quality !== undefined) {
    writeVarint32(bb, 32);
    writeVarint64(bb, intToLong($quality));
  }

  // optional int32 level = 5;
  let $level = message.level;
  if ($level !== undefined) {
    writeVarint32(bb, 40);
    writeVarint64(bb, intToLong($level));
  }

  // repeated Attribute attributes = 6;
  let array$attributes = message.attributes;
  if (array$attributes !== undefined) {
    for (let value of array$attributes) {
      writeVarint32(bb, 50);
      let nested = popByteBuffer();
      _encodeAttribute(value, nested);
      writeVarint32(bb, nested.limit);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }

  // optional int32 transformation = 7;
  let $transformation = message.transformation;
  if ($transformation !== undefined) {
    writeVarint32(bb, 56);
    writeVarint64(bb, intToLong($transformation));
  }
}

export function decodeEquip(binary: Uint8Array): Equip {
  return _decodeEquip(wrapByteBuffer(binary));
}

function _decodeEquip(bb: ByteBuffer): Equip {
  let message: Equip = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional Part part = 1;
      case 1: {
        message.part = decodePart[readVarint32(bb)];
        break;
      }

      // optional string name = 2;
      case 2: {
        message.name = readString(bb, readVarint32(bb));
        break;
      }

      // optional int32 icon = 3;
      case 3: {
        message.icon = readVarint32(bb);
        break;
      }

      // optional int32 quality = 4;
      case 4: {
        message.quality = readVarint32(bb);
        break;
      }

      // optional int32 level = 5;
      case 5: {
        message.level = readVarint32(bb);
        break;
      }

      // repeated Attribute attributes = 6;
      case 6: {
        let limit = pushTemporaryLength(bb);
        let values = message.attributes || (message.attributes = []);
        values.push(_decodeAttribute(bb));
        bb.limit = limit;
        break;
      }

      // optional int32 transformation = 7;
      case 7: {
        message.transformation = readVarint32(bb);
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface Item {
  id?: number;
  count?: number;
}

export function encodeItem(message: Item): Uint8Array {
  let bb = popByteBuffer();
  _encodeItem(message, bb);
  return toUint8Array(bb);
}

function _encodeItem(message: Item, bb: ByteBuffer): void {
  // optional int32 id = 1;
  let $id = message.id;
  if ($id !== undefined) {
    writeVarint32(bb, 8);
    writeVarint64(bb, intToLong($id));
  }

  // optional int32 count = 2;
  let $count = message.count;
  if ($count !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($count));
  }
}

export function decodeItem(binary: Uint8Array): Item {
  return _decodeItem(wrapByteBuffer(binary));
}

function _decodeItem(bb: ByteBuffer): Item {
  let message: Item = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int32 id = 1;
      case 1: {
        message.id = readVarint32(bb);
        break;
      }

      // optional int32 count = 2;
      case 2: {
        message.count = readVarint32(bb);
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export class LoginRequest {
  username?: string;
  password?: string;
}

export function encodeLoginRequest(message: LoginRequest): Uint8Array {
  let bb = popByteBuffer();
  _encodeLoginRequest(message, bb);
  return toUint8Array(bb);
}

function _encodeLoginRequest(message: LoginRequest, bb: ByteBuffer): void {
  // optional string username = 1;
  let $username = message.username;
  if ($username !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $username);
  }

  // optional string password = 2;
  let $password = message.password;
  if ($password !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $password);
  }
}

export function decodeLoginRequest(binary: Uint8Array): LoginRequest {
  return _decodeLoginRequest(wrapByteBuffer(binary));
}

function _decodeLoginRequest(bb: ByteBuffer): LoginRequest {
  let message: LoginRequest = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string username = 1;
      case 1: {
        message.username = readString(bb, readVarint32(bb));
        break;
      }

      // optional string password = 2;
      case 2: {
        message.password = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface LoginResponse {
  identity?: string;
}

export function encodeLoginResponse(message: LoginResponse): Uint8Array {
  let bb = popByteBuffer();
  _encodeLoginResponse(message, bb);
  return toUint8Array(bb);
}

function _encodeLoginResponse(message: LoginResponse, bb: ByteBuffer): void {
  // optional string identity = 1;
  let $identity = message.identity;
  if ($identity !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $identity);
  }
}

export function decodeLoginResponse(binary: Uint8Array): LoginResponse {
  return _decodeLoginResponse(wrapByteBuffer(binary));
}

function _decodeLoginResponse(bb: ByteBuffer): LoginResponse {
  let message: LoginResponse = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string identity = 1;
      case 1: {
        message.identity = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export class GetDressingResponse {
  parts?: Equip[];
}

export function encodeGetDressingResponse(message: GetDressingResponse): Uint8Array {
  let bb = popByteBuffer();
  _encodeGetDressingResponse(message, bb);
  return toUint8Array(bb);
}

function _encodeGetDressingResponse(message: GetDressingResponse, bb: ByteBuffer): void {
  // repeated Equip parts = 1;
  let array$parts = message.parts;
  if (array$parts !== undefined) {
    for (let value of array$parts) {
      writeVarint32(bb, 10);
      let nested = popByteBuffer();
      _encodeEquip(value, nested);
      writeVarint32(bb, nested.limit);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }
}

export function decodeGetDressingResponse(binary: Uint8Array): GetDressingResponse {
  return _decodeGetDressingResponse(wrapByteBuffer(binary));
}

function _decodeGetDressingResponse(bb: ByteBuffer): GetDressingResponse {
  let message: GetDressingResponse = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // repeated Equip parts = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        let values = message.parts || (message.parts = []);
        values.push(_decodeEquip(bb));
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export class TransformationRequest {
  part?: Part;
  target?: number;
}

export function encodeTransformationRequest(message: TransformationRequest): Uint8Array {
  let bb = popByteBuffer();
  _encodeTransformationRequest(message, bb);
  return toUint8Array(bb);
}

function _encodeTransformationRequest(message: TransformationRequest, bb: ByteBuffer): void {
  // optional Part part = 1;
  let $part = message.part;
  if ($part !== undefined) {
    writeVarint32(bb, 8);
    writeVarint32(bb, encodePart[$part]);
  }

  // optional int32 target = 2;
  let $target = message.target;
  if ($target !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($target));
  }
}

export function decodeTransformationRequest(binary: Uint8Array): TransformationRequest {
  return _decodeTransformationRequest(wrapByteBuffer(binary));
}

function _decodeTransformationRequest(bb: ByteBuffer): TransformationRequest {
  let message: TransformationRequest = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional Part part = 1;
      case 1: {
        message.part = decodePart[readVarint32(bb)];
        break;
      }

      // optional int32 target = 2;
      case 2: {
        message.target = readVarint32(bb);
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export class GetItemsRequest {
  item_ids?: number[];
}

export function encodeGetItemsRequest(message: GetItemsRequest): Uint8Array {
  let bb = popByteBuffer();
  _encodeGetItemsRequest(message, bb);
  return toUint8Array(bb);
}

function _encodeGetItemsRequest(message: GetItemsRequest, bb: ByteBuffer): void {
  // repeated int32 item_ids = 1;
  let array$item_ids = message.item_ids;
  if (array$item_ids !== undefined) {
    let packed = popByteBuffer();
    for (let value of array$item_ids) {
      writeVarint64(packed, intToLong(value));
    }
    writeVarint32(bb, 10);
    writeVarint32(bb, packed.offset);
    writeByteBuffer(bb, packed);
    pushByteBuffer(packed);
  }
}

export function decodeGetItemsRequest(binary: Uint8Array): GetItemsRequest {
  return _decodeGetItemsRequest(wrapByteBuffer(binary));
}

function _decodeGetItemsRequest(bb: ByteBuffer): GetItemsRequest {
  let message: GetItemsRequest = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // repeated int32 item_ids = 1;
      case 1: {
        let values = message.item_ids || (message.item_ids = []);
        if ((tag & 7) === 2) {
          let outerLimit = pushTemporaryLength(bb);
          while (!isAtEnd(bb)) {
            values.push(readVarint32(bb));
          }
          bb.limit = outerLimit;
        } else {
          values.push(readVarint32(bb));
        }
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface GetItemsResponse {
  items?: Item[];
}

export function encodeGetItemsResponse(message: GetItemsResponse): Uint8Array {
  let bb = popByteBuffer();
  _encodeGetItemsResponse(message, bb);
  return toUint8Array(bb);
}

function _encodeGetItemsResponse(message: GetItemsResponse, bb: ByteBuffer): void {
  // repeated Item items = 1;
  let array$items = message.items;
  if (array$items !== undefined) {
    for (let value of array$items) {
      writeVarint32(bb, 10);
      let nested = popByteBuffer();
      _encodeItem(value, nested);
      writeVarint32(bb, nested.limit);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }
}

export function decodeGetItemsResponse(binary: Uint8Array): GetItemsResponse {
  return _decodeGetItemsResponse(wrapByteBuffer(binary));
}

function _decodeGetItemsResponse(bb: ByteBuffer): GetItemsResponse {
  let message: GetItemsResponse = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // repeated Item items = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        let values = message.items || (message.items = []);
        values.push(_decodeItem(bb));
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export class GashaponRequest {
  dispose?: AutoDispose;
}

export function encodeGashaponRequest(message: GashaponRequest): Uint8Array {
  let bb = popByteBuffer();
  _encodeGashaponRequest(message, bb);
  return toUint8Array(bb);
}

function _encodeGashaponRequest(message: GashaponRequest, bb: ByteBuffer): void {
  // optional AutoDispose dispose = 1;
  let $dispose = message.dispose;
  if ($dispose !== undefined) {
    writeVarint32(bb, 10);
    let nested = popByteBuffer();
    _encodeAutoDispose($dispose, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeGashaponRequest(binary: Uint8Array): GashaponRequest {
  return _decodeGashaponRequest(wrapByteBuffer(binary));
}

function _decodeGashaponRequest(bb: ByteBuffer): GashaponRequest {
  let message: GashaponRequest = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional AutoDispose dispose = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        message.dispose = _decodeAutoDispose(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface AutoDispose {
  type?: AutoType;
  count?: number;
  quality?: number;
}

export function encodeAutoDispose(message: AutoDispose): Uint8Array {
  let bb = popByteBuffer();
  _encodeAutoDispose(message, bb);
  return toUint8Array(bb);
}

function _encodeAutoDispose(message: AutoDispose, bb: ByteBuffer): void {
  // optional AutoType type = 1;
  let $type = message.type;
  if ($type !== undefined) {
    writeVarint32(bb, 10);
    let nested = popByteBuffer();
    _encodeAutoType($type, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional int32 count = 2;
  let $count = message.count;
  if ($count !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($count));
  }

  // optional int32 quality = 3;
  let $quality = message.quality;
  if ($quality !== undefined) {
    writeVarint32(bb, 24);
    writeVarint64(bb, intToLong($quality));
  }
}

export function decodeAutoDispose(binary: Uint8Array): AutoDispose {
  return _decodeAutoDispose(wrapByteBuffer(binary));
}

function _decodeAutoDispose(bb: ByteBuffer): AutoDispose {
  let message: AutoDispose = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional AutoType type = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        message.type = _decodeAutoType(bb);
        bb.limit = limit;
        break;
      }

      // optional int32 count = 2;
      case 2: {
        message.count = readVarint32(bb);
        break;
      }

      // optional int32 quality = 3;
      case 3: {
        message.quality = readVarint32(bb);
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface GashaponResponse {
  part?: Equip;
  items?: Item[];
}

export function encodeGashaponResponse(message: GashaponResponse): Uint8Array {
  let bb = popByteBuffer();
  _encodeGashaponResponse(message, bb);
  return toUint8Array(bb);
}

function _encodeGashaponResponse(message: GashaponResponse, bb: ByteBuffer): void {
  // optional Equip part = 1;
  let $part = message.part;
  if ($part !== undefined) {
    writeVarint32(bb, 10);
    let nested = popByteBuffer();
    _encodeEquip($part, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // repeated Item items = 2;
  let array$items = message.items;
  if (array$items !== undefined) {
    for (let value of array$items) {
      writeVarint32(bb, 18);
      let nested = popByteBuffer();
      _encodeItem(value, nested);
      writeVarint32(bb, nested.limit);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }
}

export function decodeGashaponResponse(binary: Uint8Array): GashaponResponse {
  return _decodeGashaponResponse(wrapByteBuffer(binary));
}

function _decodeGashaponResponse(bb: ByteBuffer): GashaponResponse {
  let message: GashaponResponse = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional Equip part = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        message.part = _decodeEquip(bb);
        bb.limit = limit;
        break;
      }

      // repeated Item items = 2;
      case 2: {
        let limit = pushTemporaryLength(bb);
        let values = message.items || (message.items = []);
        values.push(_decodeItem(bb));
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export class LevelUpRequest {
}

export function encodeLevelUpRequest(message: LevelUpRequest): Uint8Array {
  let bb = popByteBuffer();
  _encodeLevelUpRequest(message, bb);
  return toUint8Array(bb);
}

function _encodeLevelUpRequest(message: LevelUpRequest, bb: ByteBuffer): void {
}

export function decodeLevelUpRequest(binary: Uint8Array): LevelUpRequest {
  return _decodeLevelUpRequest(wrapByteBuffer(binary));
}

function _decodeLevelUpRequest(bb: ByteBuffer): LevelUpRequest {
  let message: LevelUpRequest = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface Long {
  low: number;
  high: number;
  unsigned: boolean;
}

interface ByteBuffer {
  bytes: Uint8Array;
  offset: number;
  limit: number;
}

function pushTemporaryLength(bb: ByteBuffer): number {
  let length = readVarint32(bb);
  let limit = bb.limit;
  bb.limit = bb.offset + length;
  return limit;
}

function skipUnknownField(bb: ByteBuffer, type: number): void {
  switch (type) {
    case 0: while (readByte(bb) & 0x80) { } break;
    case 2: skip(bb, readVarint32(bb)); break;
    case 5: skip(bb, 4); break;
    case 1: skip(bb, 8); break;
    default: throw new Error("Unimplemented type: " + type);
  }
}

function stringToLong(value: string): Long {
  return {
    low: value.charCodeAt(0) | (value.charCodeAt(1) << 16),
    high: value.charCodeAt(2) | (value.charCodeAt(3) << 16),
    unsigned: false,
  };
}

function longToString(value: Long): string {
  let low = value.low;
  let high = value.high;
  return String.fromCharCode(
    low & 0xFFFF,
    low >>> 16,
    high & 0xFFFF,
    high >>> 16);
}

// The code below was modified from https://github.com/protobufjs/bytebuffer.js
// which is under the Apache License 2.0.

let f32 = new Float32Array(1);
let f32_u8 = new Uint8Array(f32.buffer);

let f64 = new Float64Array(1);
let f64_u8 = new Uint8Array(f64.buffer);

function intToLong(value: number): Long {
  value |= 0;
  return {
    low: value,
    high: value >> 31,
    unsigned: value >= 0,
  };
}

let bbStack: ByteBuffer[] = [];

function popByteBuffer(): ByteBuffer {
  const bb = bbStack.pop();
  if (!bb) return { bytes: new Uint8Array(64), offset: 0, limit: 0 };
  bb.offset = bb.limit = 0;
  return bb;
}

function pushByteBuffer(bb: ByteBuffer): void {
  bbStack.push(bb);
}

function wrapByteBuffer(bytes: Uint8Array): ByteBuffer {
  return { bytes, offset: 0, limit: bytes.length };
}

function toUint8Array(bb: ByteBuffer): Uint8Array {
  let bytes = bb.bytes;
  let limit = bb.limit;
  return bytes.length === limit ? bytes : bytes.subarray(0, limit);
}

function skip(bb: ByteBuffer, offset: number): void {
  if (bb.offset + offset > bb.limit) {
    throw new Error('Skip past limit');
  }
  bb.offset += offset;
}

function isAtEnd(bb: ByteBuffer): boolean {
  return bb.offset >= bb.limit;
}

function grow(bb: ByteBuffer, count: number): number {
  let bytes = bb.bytes;
  let offset = bb.offset;
  let limit = bb.limit;
  let finalOffset = offset + count;
  if (finalOffset > bytes.length) {
    let newBytes = new Uint8Array(finalOffset * 2);
    newBytes.set(bytes);
    bb.bytes = newBytes;
  }
  bb.offset = finalOffset;
  if (finalOffset > limit) {
    bb.limit = finalOffset;
  }
  return offset;
}

function advance(bb: ByteBuffer, count: number): number {
  let offset = bb.offset;
  if (offset + count > bb.limit) {
    throw new Error('Read past limit');
  }
  bb.offset += count;
  return offset;
}

function readBytes(bb: ByteBuffer, count: number): Uint8Array {
  let offset = advance(bb, count);
  return bb.bytes.subarray(offset, offset + count);
}

function writeBytes(bb: ByteBuffer, buffer: Uint8Array): void {
  let offset = grow(bb, buffer.length);
  bb.bytes.set(buffer, offset);
}

function readString(bb: ByteBuffer, count: number): string {
  // Sadly a hand-coded UTF8 decoder is much faster than subarray+TextDecoder in V8
  let offset = advance(bb, count);
  let fromCharCode = String.fromCharCode;
  let bytes = bb.bytes;
  let invalid = '\uFFFD';
  let text = '';

  for (let i = 0; i < count; i++) {
    let c1 = bytes[i + offset], c2: number, c3: number, c4: number, c: number;

    // 1 byte
    if ((c1 & 0x80) === 0) {
      text += fromCharCode(c1);
    }

    // 2 bytes
    else if ((c1 & 0xE0) === 0xC0) {
      if (i + 1 >= count) text += invalid;
      else {
        c2 = bytes[i + offset + 1];
        if ((c2 & 0xC0) !== 0x80) text += invalid;
        else {
          c = ((c1 & 0x1F) << 6) | (c2 & 0x3F);
          if (c < 0x80) text += invalid;
          else {
            text += fromCharCode(c);
            i++;
          }
        }
      }
    }

    // 3 bytes
    else if ((c1 & 0xF0) == 0xE0) {
      if (i + 2 >= count) text += invalid;
      else {
        c2 = bytes[i + offset + 1];
        c3 = bytes[i + offset + 2];
        if (((c2 | (c3 << 8)) & 0xC0C0) !== 0x8080) text += invalid;
        else {
          c = ((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6) | (c3 & 0x3F);
          if (c < 0x0800 || (c >= 0xD800 && c <= 0xDFFF)) text += invalid;
          else {
            text += fromCharCode(c);
            i += 2;
          }
        }
      }
    }

    // 4 bytes
    else if ((c1 & 0xF8) == 0xF0) {
      if (i + 3 >= count) text += invalid;
      else {
        c2 = bytes[i + offset + 1];
        c3 = bytes[i + offset + 2];
        c4 = bytes[i + offset + 3];
        if (((c2 | (c3 << 8) | (c4 << 16)) & 0xC0C0C0) !== 0x808080) text += invalid;
        else {
          c = ((c1 & 0x07) << 0x12) | ((c2 & 0x3F) << 0x0C) | ((c3 & 0x3F) << 0x06) | (c4 & 0x3F);
          if (c < 0x10000 || c > 0x10FFFF) text += invalid;
          else {
            c -= 0x10000;
            text += fromCharCode((c >> 10) + 0xD800, (c & 0x3FF) + 0xDC00);
            i += 3;
          }
        }
      }
    }

    else text += invalid;
  }

  return text;
}

function writeString(bb: ByteBuffer, text: string): void {
  // Sadly a hand-coded UTF8 encoder is much faster than TextEncoder+set in V8
  let n = text.length;
  let byteCount = 0;

  // Write the byte count first
  for (let i = 0; i < n; i++) {
    let c = text.charCodeAt(i);
    if (c >= 0xD800 && c <= 0xDBFF && i + 1 < n) {
      c = (c << 10) + text.charCodeAt(++i) - 0x35FDC00;
    }
    byteCount += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }
  writeVarint32(bb, byteCount);

  let offset = grow(bb, byteCount);
  let bytes = bb.bytes;

  // Then write the bytes
  for (let i = 0; i < n; i++) {
    let c = text.charCodeAt(i);
    if (c >= 0xD800 && c <= 0xDBFF && i + 1 < n) {
      c = (c << 10) + text.charCodeAt(++i) - 0x35FDC00;
    }
    if (c < 0x80) {
      bytes[offset++] = c;
    } else {
      if (c < 0x800) {
        bytes[offset++] = ((c >> 6) & 0x1F) | 0xC0;
      } else {
        if (c < 0x10000) {
          bytes[offset++] = ((c >> 12) & 0x0F) | 0xE0;
        } else {
          bytes[offset++] = ((c >> 18) & 0x07) | 0xF0;
          bytes[offset++] = ((c >> 12) & 0x3F) | 0x80;
        }
        bytes[offset++] = ((c >> 6) & 0x3F) | 0x80;
      }
      bytes[offset++] = (c & 0x3F) | 0x80;
    }
  }
}

function writeByteBuffer(bb: ByteBuffer, buffer: ByteBuffer): void {
  let offset = grow(bb, buffer.limit);
  let from = bb.bytes;
  let to = buffer.bytes;

  // This for loop is much faster than subarray+set on V8
  for (let i = 0, n = buffer.limit; i < n; i++) {
    from[i + offset] = to[i];
  }
}

function readByte(bb: ByteBuffer): number {
  return bb.bytes[advance(bb, 1)];
}

function writeByte(bb: ByteBuffer, value: number): void {
  let offset = grow(bb, 1);
  bb.bytes[offset] = value;
}

function readFloat(bb: ByteBuffer): number {
  let offset = advance(bb, 4);
  let bytes = bb.bytes;

  // Manual copying is much faster than subarray+set in V8
  f32_u8[0] = bytes[offset++];
  f32_u8[1] = bytes[offset++];
  f32_u8[2] = bytes[offset++];
  f32_u8[3] = bytes[offset++];
  return f32[0];
}

function writeFloat(bb: ByteBuffer, value: number): void {
  let offset = grow(bb, 4);
  let bytes = bb.bytes;
  f32[0] = value;

  // Manual copying is much faster than subarray+set in V8
  bytes[offset++] = f32_u8[0];
  bytes[offset++] = f32_u8[1];
  bytes[offset++] = f32_u8[2];
  bytes[offset++] = f32_u8[3];
}

function readDouble(bb: ByteBuffer): number {
  let offset = advance(bb, 8);
  let bytes = bb.bytes;

  // Manual copying is much faster than subarray+set in V8
  f64_u8[0] = bytes[offset++];
  f64_u8[1] = bytes[offset++];
  f64_u8[2] = bytes[offset++];
  f64_u8[3] = bytes[offset++];
  f64_u8[4] = bytes[offset++];
  f64_u8[5] = bytes[offset++];
  f64_u8[6] = bytes[offset++];
  f64_u8[7] = bytes[offset++];
  return f64[0];
}

function writeDouble(bb: ByteBuffer, value: number): void {
  let offset = grow(bb, 8);
  let bytes = bb.bytes;
  f64[0] = value;

  // Manual copying is much faster than subarray+set in V8
  bytes[offset++] = f64_u8[0];
  bytes[offset++] = f64_u8[1];
  bytes[offset++] = f64_u8[2];
  bytes[offset++] = f64_u8[3];
  bytes[offset++] = f64_u8[4];
  bytes[offset++] = f64_u8[5];
  bytes[offset++] = f64_u8[6];
  bytes[offset++] = f64_u8[7];
}

function readInt32(bb: ByteBuffer): number {
  let offset = advance(bb, 4);
  let bytes = bb.bytes;
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  );
}

function writeInt32(bb: ByteBuffer, value: number): void {
  let offset = grow(bb, 4);
  let bytes = bb.bytes;
  bytes[offset] = value;
  bytes[offset + 1] = value >> 8;
  bytes[offset + 2] = value >> 16;
  bytes[offset + 3] = value >> 24;
}

function readInt64(bb: ByteBuffer, unsigned: boolean): Long {
  return {
    low: readInt32(bb),
    high: readInt32(bb),
    unsigned,
  };
}

function writeInt64(bb: ByteBuffer, value: Long): void {
  writeInt32(bb, value.low);
  writeInt32(bb, value.high);
}

function readVarint32(bb: ByteBuffer): number {
  let c = 0;
  let value = 0;
  let b: number;
  do {
    b = readByte(bb);
    if (c < 32) value |= (b & 0x7F) << c;
    c += 7;
  } while (b & 0x80);
  return value;
}

function writeVarint32(bb: ByteBuffer, value: number): void {
  value >>>= 0;
  while (value >= 0x80) {
    writeByte(bb, (value & 0x7f) | 0x80);
    value >>>= 7;
  }
  writeByte(bb, value);
}

function readVarint64(bb: ByteBuffer, unsigned: boolean): Long {
  let part0 = 0;
  let part1 = 0;
  let part2 = 0;
  let b: number;

  b = readByte(bb); part0 = (b & 0x7F); if (b & 0x80) {
    b = readByte(bb); part0 |= (b & 0x7F) << 7; if (b & 0x80) {
      b = readByte(bb); part0 |= (b & 0x7F) << 14; if (b & 0x80) {
        b = readByte(bb); part0 |= (b & 0x7F) << 21; if (b & 0x80) {

          b = readByte(bb); part1 = (b & 0x7F); if (b & 0x80) {
            b = readByte(bb); part1 |= (b & 0x7F) << 7; if (b & 0x80) {
              b = readByte(bb); part1 |= (b & 0x7F) << 14; if (b & 0x80) {
                b = readByte(bb); part1 |= (b & 0x7F) << 21; if (b & 0x80) {

                  b = readByte(bb); part2 = (b & 0x7F); if (b & 0x80) {
                    b = readByte(bb); part2 |= (b & 0x7F) << 7;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return {
    low: part0 | (part1 << 28),
    high: (part1 >>> 4) | (part2 << 24),
    unsigned,
  };
}

function writeVarint64(bb: ByteBuffer, value: Long): void {
  let part0 = value.low >>> 0;
  let part1 = ((value.low >>> 28) | (value.high << 4)) >>> 0;
  let part2 = value.high >>> 24;

  // ref: src/google/protobuf/io/coded_stream.cc
  let size =
    part2 === 0 ?
      part1 === 0 ?
        part0 < 1 << 14 ?
          part0 < 1 << 7 ? 1 : 2 :
          part0 < 1 << 21 ? 3 : 4 :
        part1 < 1 << 14 ?
          part1 < 1 << 7 ? 5 : 6 :
          part1 < 1 << 21 ? 7 : 8 :
      part2 < 1 << 7 ? 9 : 10;

  let offset = grow(bb, size);
  let bytes = bb.bytes;

  switch (size) {
    case 10: bytes[offset + 9] = (part2 >>> 7) & 0x01;
    case 9: bytes[offset + 8] = size !== 9 ? part2 | 0x80 : part2 & 0x7F;
    case 8: bytes[offset + 7] = size !== 8 ? (part1 >>> 21) | 0x80 : (part1 >>> 21) & 0x7F;
    case 7: bytes[offset + 6] = size !== 7 ? (part1 >>> 14) | 0x80 : (part1 >>> 14) & 0x7F;
    case 6: bytes[offset + 5] = size !== 6 ? (part1 >>> 7) | 0x80 : (part1 >>> 7) & 0x7F;
    case 5: bytes[offset + 4] = size !== 5 ? part1 | 0x80 : part1 & 0x7F;
    case 4: bytes[offset + 3] = size !== 4 ? (part0 >>> 21) | 0x80 : (part0 >>> 21) & 0x7F;
    case 3: bytes[offset + 2] = size !== 3 ? (part0 >>> 14) | 0x80 : (part0 >>> 14) & 0x7F;
    case 2: bytes[offset + 1] = size !== 2 ? (part0 >>> 7) | 0x80 : (part0 >>> 7) & 0x7F;
    case 1: bytes[offset] = size !== 1 ? part0 | 0x80 : part0 & 0x7F;
  }
}

function readVarint32ZigZag(bb: ByteBuffer): number {
  let value = readVarint32(bb);

  // ref: src/google/protobuf/wire_format_lite.h
  return (value >>> 1) ^ -(value & 1);
}

function writeVarint32ZigZag(bb: ByteBuffer, value: number): void {
  // ref: src/google/protobuf/wire_format_lite.h
  writeVarint32(bb, (value << 1) ^ (value >> 31));
}

function readVarint64ZigZag(bb: ByteBuffer): Long {
  let value = readVarint64(bb, /* unsigned */ false);
  let low = value.low;
  let high = value.high;
  let flip = -(low & 1);

  // ref: src/google/protobuf/wire_format_lite.h
  return {
    low: ((low >>> 1) | (high << 31)) ^ flip,
    high: (high >>> 1) ^ flip,
    unsigned: false,
  };
}

function writeVarint64ZigZag(bb: ByteBuffer, value: Long): void {
  let low = value.low;
  let high = value.high;
  let flip = high >> 31;

  // ref: src/google/protobuf/wire_format_lite.h
  writeVarint64(bb, {
    low: (low << 1) ^ flip,
    high: ((high << 1) | (low >>> 31)) ^ flip,
    unsigned: false,
  });
}
