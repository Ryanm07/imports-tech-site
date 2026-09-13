"""Build an original AN515-54 visualization in Blender, with a movable display.

Run in Blender's Python API (including its local MCP add-on). Existing scenes
are preserved. Export uses meters and glTF Y-up; the website rotates LidPivot.
References and fidelity limits: docs/models/acer-nitro5.md.
"""
import bpy
import math
from pathlib import Path
from mathutils import Vector

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / 'outputs' / 'nitro5'
OUT.mkdir(parents=True, exist_ok=True)
MODEL = REPO / 'public' / 'models' / 'acer-nitro5-an515-54.glb'
SCENE_NAME = 'Imports Tech - Acer Nitro 5'

# Replace only our own generated scene when iterating, never the user's work.
previous = bpy.data.scenes.get(SCENE_NAME)
scene = bpy.data.scenes.new(SCENE_NAME + ' build')
bpy.context.window.scene = scene
if previous:
    for obj in list(previous.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.scenes.remove(previous)
scene.name = SCENE_NAME
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1

def xyz(v):
    return (v[0], -v[2], v[1])

def material(name, color, metallic=0, roughness=.45, emission=0):
    mat = bpy.data.materials.new('Nitro_' + name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if emission:
        bsdf.inputs['Emission Color'].default_value = (*color, 1)
        bsdf.inputs['Emission Strength'].default_value = emission
    return mat

black = material('Obsidian polymer', (.006, .007, .009), .18, .37)
deck = material('Brushed deck', (.011, .013, .016), .25, .43)
edge = material('Chamfer highlight', (.031, .035, .042), .4, .30)
rubber = material('Rubber and recesses', (.006, .008, .012), 0, .82)
red = material('Nitro red', (.26, .002, .005), .3, .34)
keylight = material('Red backlight', (.45, .002, .008), .05, .38, .18)
silver = material('Silver markings', (.55, .59, .63), .7, .27)
screen = material('Screen glass', (.003, .005, .009), .15, .19)
screen_red = material('Screen crimson', (.30, .002, .008), .1, .6, .8)
screen_red.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.01,.001,.002,1)
screen_bright = material('Screen lettering', (.82, .86, .91), 0, .45, .7)
blue = material('Intel blue', (.008, .09, .29), .2, .4)
green = material('Nvidia green', (.18, .39, .007), .05, .4)

def empty(name, parent=None, pos=(0,0,0)):
    obj = bpy.data.objects.new(name, None)
    scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = xyz(pos)
    return obj

root = empty('Nitro5Root')
base = empty('NitroBase', root)
lid = empty('LidPivot', root, (0,.022,-.116))
root['model'] = 'Acer Nitro 5 AN515-54'
root['source_video'] = 'https://www.youtube.com/watch?v=Y1nStLptXY0'
root['units'] = 'meters'
lid['open_angle_degrees'] = -112

def box(name, pos, size, mat, parent=base, bevel=0, segments=1):
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.location = xyz(pos)
    obj.dimensions = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new('Machined edge', 'BEVEL')
        modifier.width = bevel
        modifier.segments = segments
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj

def cylinder(name, pos, radius, depth, mat, parent=base, axis='y', vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth)
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.location = xyz(pos)
    if axis == 'x': obj.rotation_euler.y = math.pi/2
    elif axis == 'z': obj.rotation_euler.x = math.pi/2
    obj.data.materials.append(mat)
    return obj

def label(name, value, pos, size, mat, parent=base, face='up', width=None):
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = value
    curve.size = size
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    curve.resolution_u = 2
    curve.extrude = 0
    if value == 'acer': curve.shear = .18
    obj = bpy.data.objects.new(name, curve)
    scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = xyz(pos)
    if face == 'down': obj.rotation_euler.x = math.pi
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj = bpy.context.object
    if width and obj.dimensions.x > width:
        obj.scale *= width / obj.dimensions.x
    obj.select_set(False)
    return obj

# Angular casing, stepped seam and a slightly recessed keyboard/palm-rest deck.
box('Lower angular chassis', (0,.0095,0), (.3634,.016,.255), black, bevel=.004, segments=2)
box('Chassis seam', (0,.0151,0), (.359,.001,.251), rubber, bevel=.003)
box('Palm rest', (0,.0172,.001), (.360,.0044,.250), deck, bevel=.003, segments=2)
box('Front bevel', (0,.011,.126), (.331,.004,.0015), edge, bevel=.0005)
for x in [-.132,.132]:
    for z in [-.095,.093]:
        box('Rubber foot', (x,.00075,z), (.043,.0015,.012), rubber, bevel=.001)
for x in [-.155,0,.155]:
    for z in [-.108,.104]:
        cylinder('Underside screw', (x,.0014,z), .0017,.0003, edge)
        box('Screw slot', (x,.0011,z), (.002,.0001,.00035), rubber)
for x in [-.066,.066]:
    for i in range(12):
        box('Bottom intake', (x+(i-5.5)*.005,.0014,-.032), (.0022,.00025,.057), rubber)

# Rear exhaust banks with red shoulders and separated black blades.
for x in [-.117,.117]:
    box('Rear exhaust red shroud', (x,.013,-.122), (.113,.014,.010), red, bevel=.002)
    box('Rear vent cavity', (x,.0128,-.127), (.098,.009,.0008), rubber)
    for i in range(13):
        box('Rear cooling fin', (x+(i-6)*.0073,.0125,-.1274), (.0018,.008,.0004), black)
    cylinder('Display hinge barrel', (x,.022,-.116), .0034,.035, black, axis='x')
    box('Hinge collar', (x,.022,-.112), (.042,.006,.013), red, bevel=.001)
box('Continuous red hinge trim', (0,.022,-.117), (.283,.004,.009), red, bevel=.001)
label('Nitro rear trim', 'N I T R O', (0,.0198,-.103), .006, red)

# I/O recessed mouths on both sides; no boolean modifiers or hidden interiors.
for z in [-.070,-.032,.006]:
    box('Left port rim', (-.1811,.011,z), (.0013,.0068,.017), edge, bevel=.0005)
    box('Left port cavity', (-.1818,.011,z), (.0003,.0048,.014), rubber)
for z in [-.032,.006]:
    box('USB blue tongue', (-.182,.0106,z), (.0002,.0012,.010), blue)
box('RJ45 mouth', (-.1818,.0105,-.094), (.0004,.009,.016), rubber)
box('USB-C mouth', (-.1818,.011,.032), (.0004,.0035,.008), rubber, bevel=.001)
box('Right USB port', (.1817,.011,.006), (.0004,.0055,.014), rubber)
cylinder('Headphone jack', (.1818,.0105,.030), .0022,.0003, rubber, axis='x')
cylinder('Power socket', (.1818,.012,-.095), .0028,.0003, rubber, axis='x')
for i in range(9):
    box('Right exhaust slot', (.1818,.012,-.067+i*.004), (.0003,.006,.002), rubber)

# Full-size red backlit keyboard, discrete keycaps, WASD outline and numeric pad.
box('Keyboard recess', (0,.01945,-.021), (.331,.0007,.114), rubber, bevel=.002)
rows = [
    [('esc',1),('F1',1),('F2',1),('F3',1),('F4',1),('F5',1),('F6',1),('F7',1),('F8',1),('F9',1),('F10',1),('F11',1),('F12',1),('del',1)],
    [('~',1),('1',1),('2',1),('3',1),('4',1),('5',1),('6',1),('7',1),('8',1),('9',1),('0',1),('-',1),('=',1),('back',1.6)],
    [('tab',1.4),('Q',1),('W',1),('E',1),('R',1),('T',1),('Y',1),('U',1),('I',1),('O',1),('P',1),('[',1),(']',1),('\\',1.2)],
    [('caps',1.7),('A',1),('S',1),('D',1),('F',1),('G',1),('H',1),('J',1),('K',1),('L',1),(';',1),("'",1),('enter',1.9)],
    [('shift',2.1),('Z',1),('X',1),('C',1),('V',1),('B',1),('N',1),('M',1),(',',1),('.',1),('/',1),('shift',2.5)],
    [('ctrl',1.2),('fn',1),('win',1),('alt',1),('',5.5),('alt',1),('ctrl',1),('<',1),('^',1),('>',1)],
]
pitch=.0169
for row, keys in enumerate(rows):
    cursor=-.1585
    z=-.067+row*.0185
    for text, units in keys:
        w=units*pitch-.0024
        x=cursor+w/2
        h=.009 if row==0 else .0148
        box('Key light rim', (x,.0200,z), (w+.0008,.0005,h+.0008), keylight)
        box('Keycap', (x,.0206,z), (w,.0013,h), black, bevel=.0008)
        if text in ['W','A','S','D']:
            box('WASD inner stroke', (x,.0213,z), (w-.0016,.00012,h-.0016), keylight)
            box('WASD inset', (x,.02142,z), (w-.0024,.0001,h-.0024), black)
        if text: label('Key legend', text, (x,.02155,z), .0028 if len(text)>1 else .0042, keylight, width=w-.002)
        cursor += units*pitch
pad=[['num','/','*','-'],['7','8','9','+'],['4','5','6',''],['1','2','3','ent'],['0','','.','']]
for row, keys in enumerate(pad):
    for col, text in enumerate(keys):
        if not text: continue
        w=.0142 if text!='0' else .0307
        h=.0148 if text not in ['+','ent'] else .0333
        x=.102+col*.0166+(0.0083 if text=='0' else 0)
        z=-.0485+row*.0185+(.00925 if text in ['+','ent'] else 0)
        box('Numeric light rim', (x,.0200,z), (w+.0008,.0005,h+.0008), keylight)
        box('Numeric keycap', (x,.0206,z), (w,.0013,h), black, bevel=.0007)
        label('Numeric legend', text, (x,.02155,z), .003, keylight, width=w-.002)

# Offset trackpad, a fine red perimeter, and the two review-unit hardware badges.
box('Touchpad red perimeter', (-.032,.0196,.079), (.105,.0005,.057), red, bevel=.002)
box('Touchpad surface', (-.032,.0200,.079), (.1028,.00045,.0548), black, bevel=.0017)
box('Intel badge', (.105,.01965,.087), (.017,.0003,.020), blue, bevel=.0007)
label('Intel badge label', 'intel\nCORE i5', (.105,.0199,.087), .0026, silver, width=.015)
box('GeForce badge', (.132,.01965,.087), (.023,.0003,.020), rubber, bevel=.0007)
box('GeForce badge bar', (.132,.01985,.094), (.021,.0001,.003), green)
label('GeForce badge label', 'GEFORCE\nGTX', (.132,.01995,.084), .0025, silver, width=.020)

# Display assembly: inner face points down when closed and towards the visitor
# after the hinge opens. All parts below are children of the one hinge pivot.
box('Lid outer shell', (0,.0013,.1175), (.359,.0048,.235), black, lid, .003, 2)
box('Display bezel', (0,-.00125,.118), (.353,.00065,.229), rubber, lid, .0018)
box('LCD panel', (0,-.00165,.1165), (.344,.00025,.1935), screen, lid, .0007)
for x in [-.169,.169]:
    box('Bezel bumper', (x,-.0018,.222), (.006,.0003,.003), rubber, lid, .0005)
cylinder('Webcam surround', (0,-.0019,.223), .0022,.0002, black, lid)
cylinder('Webcam glass', (0,-.0021,.223), .0009,.0002, blue, lid)
for x in [-.009,.009]: cylinder('Microphone pinhole', (x,-.0019,.223), .00045,.0001, edge, lid, vertices=8)
label('Inner acer badge', 'acer', (0,-.00195,.010), .008, silver, lid, face='down')

# Original screen graphic, as flat geometry: no image download or texture decoder.
def screen_polygon(name, points, mat):
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata([xyz((x,-.0019,z)) for x,z in points], [], [tuple(range(len(points)))])
    mesh.materials.append(mat)
    obj=bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    obj.parent=lid
    return obj

screen_polygon('Crimson diagonal', [(-.172,.020),(-.110,.020),(.172,.170),(.172,.212),(.143,.212)], screen_red)
screen_polygon('Dark diagonal', [(-.172,.053),(-.172,.085),(.088,.212),(.153,.212)], red)
screen_polygon('Accent slash', [(-.147,.020),(-.139,.020),(.172,.187),(.172,.192)], keylight)
label('Nitro screen wordmark', 'N I T R O  5', (0,-.0021,.119), .019, screen_bright, lid, face='down', width=.20)
label('Screen subheading', 'I M P O R T S  T E C H', (0,-.0021,.095), .0041, silver, lid, face='down')

# Outer acer emblem, understated angular panel texture and the AN515-54 silhouette.
label('Outer acer emblem', 'acer', (0,.00376,.118), .025, edge, lid)
for side in [-1,1]:
    for i in range(21):
        x=side*(.123+i*.0022)
        box('Lid brushed accent', (x,.00374,.1175), (.00025,.00004,.184), edge, lid)

# Join by material and moving assembly. This keeps individual modeled details
# but reduces hundreds of authoring objects to a small number of GPU draws.
for parent in [base,lid]:
    for mat in list(bpy.data.materials):
        objects=[o for o in parent.children if o.type=='MESH' and o.active_material==mat]
        if not objects: continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects: o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1: bpy.ops.object.join()
        joined=bpy.context.object
        joined.name=('Base_' if parent==base else 'Display_')+mat.name

def descendants(obj):
    return [obj]+[c for child in obj.children for c in descendants(child)]

model_objects=descendants(root)
bpy.ops.object.select_all(action='DESELECT')
for obj in model_objects: obj.select_set(True)
bpy.context.view_layer.objects.active=root
lid.rotation_euler.x=0
bpy.ops.export_scene.gltf(filepath=str(MODEL), export_format='GLB', use_selection=True,
    export_animations=False, export_cameras=False, export_lights=False,
    export_extras=True, export_yup=True, export_texcoords=False, export_normals=True)

# A saved native source with a reusable open/close animation for further editing.
for frame, angle in [(1,0),(42,-112),(95,-112),(136,0)]:
    lid.rotation_euler.x=math.radians(angle)
    lid.keyframe_insert(data_path='rotation_euler', frame=frame)
scene.frame_start=1
scene.frame_end=136
scene.frame_set(60)

scene.render.engine='CYCLES'
scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.render.resolution_x=1400
scene.render.resolution_y=1000
scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Nitro product environment')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.15,.17,.21,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35
floor=box('Render plinth',(0,-.008,0),(2,.015,2),material('Backdrop',(.065,.076,.092),0,.62),parent=None)

def area(name, pos, energy, size, color):
    data=bpy.data.lights.new(name,'AREA')
    data.energy=energy
    data.shape='DISK'
    data.size=size
    data.color=color
    obj=bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj)
    obj.location=xyz(pos)
    obj.rotation_euler=(Vector(xyz((0,.08,0)))-obj.location).to_track_quat('-Z','Y').to_euler()
area('Large softbox',(-.45,.7,.45),35,.65,(.85,.92,1))
area('Edge strip',(.42,.4,-.30),24,.4,(1,.68,.56))
area('Keyboard fill',(.1,.3,.5),12,.3,(1,1,1))
camera_data=bpy.data.cameras.new('Nitro product camera')
camera=bpy.data.objects.new('Nitro product camera',camera_data)
scene.collection.objects.link(camera)
scene.camera=camera
camera.location=xyz((.47,.36,.54))
camera.rotation_euler=(Vector(xyz((0,.09,-.015)))-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.type='ORTHO'
camera_data.ortho_scale=.66
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(OUT/'nitro5-open.png')
scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'acer-nitro5-an515-54.blend'),copy=True)

result={'model':str(MODEL),'bytes':MODEL.stat().st_size,'native_source':str(OUT/'acer-nitro5-an515-54.blend'),
        'mesh_objects':sum(o.type=='MESH' for o in model_objects),'scene':scene.name}
