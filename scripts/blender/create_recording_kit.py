"""Original Imports Tech recording kit, built in the running Blender via MCP.

Native edit scene uses meters and Z-up. glTF exports use Y-up. Existing scenes
are preserved. No website files are changed. See outputs/referencias-ulanzi-s25.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / 'outputs' / 'recording-kit'
OUT.mkdir(parents=True, exist_ok=True)
SCENE_NAME = 'Imports Tech - Recording Kit'


def load_builder(filename, function):
    path = Path(__file__).parent / filename
    namespace = {'__file__': str(path), '__name__': 'recording_part'}
    exec(compile(path.read_text(encoding='utf-8-sig'), str(path), 'exec'), namespace)
    return namespace[function]


def descendant_objects(root):
    return [root, *root.children_recursive]


def create_scene(name):
    # Preserve every earlier build and any work that was open before this task.
    scene = bpy.data.scenes.new(name)
    bpy.context.window.scene = scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0
    return scene


def organize(scene, root, name):
    collection = bpy.data.collections.new(name)
    scene.collection.children.link(collection)
    for obj in descendant_objects(root):
        for old in list(obj.users_collection):
            old.objects.unlink(obj)
        collection.objects.link(obj)
    return collection


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


def mat(name, color, roughness=.5, metallic=0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return material


def light(scene, name, pos, energy, size, color, target, size_y=None):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.shape = 'DISK' if size_y is None else 'RECTANGLE'
    data.size = size
    if size_y is not None:
        data.size_y = size_y
    data.color = color
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = pos
    look_at(obj, target)
    return obj


def set_presentation(scene, height):
    world = bpy.data.worlds.new('Recording Kit - neutral studio')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (.32, .36, .43, 1)
    world.node_tree.nodes['Background'].inputs[1].default_value = .2
    scene.world = world
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 40
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 6
    scene.render.resolution_x = 1440
    scene.render.resolution_y = 1440
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.film_transparent = False
    scene.view_settings.view_transform = 'AgX'
    stage = bpy.data.collections.new('Presentation - excluded from GLB')
    scene.collection.children.link(stage)
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.001))
    ground = bpy.context.object
    ground.name = 'Presentation seamless ground'
    ground.data.materials.append(mat('Presentation warm graphite', (.075, .086, .10), .62))
    for col in list(ground.users_collection):
        col.objects.unlink(ground)
    stage.objects.link(ground)
    target = (0, 0, height * .53)
    lamps = [
        light(scene, 'Softbox key', (-.35, -.5, .8), 10, .55, (1, .91, .8), target),
        light(scene, 'Softbox fill', (.5, -.1, .45), 5, .40, (.74, .84, 1), target),
        light(scene, 'Softbox edge', (.0, .35, .7), 12, .32, (1, .95, .87), target),
        light(scene, 'Operator side fill', (-.35, .5, .45), 4, .3, (.80, .88, 1), target),
    ]
    for obj in lamps:
        for col in list(obj.users_collection):
            col.objects.unlink(obj)
        stage.objects.link(obj)
    cameras = []
    for name, pos in [('Kit - Front three quarter', (.43, -.72, .45)),
                      ('Kit - Operator side', (-.43, .72, .44)),
                      ('Kit - Front elevation', (0, -.85, height*.52))]:
        data = bpy.data.cameras.new(name)
        obj = bpy.data.objects.new(name, data)
        stage.objects.link(obj)
        obj.location = pos
        look_at(obj, target)
        data.type = 'ORTHO'
        data.ortho_scale = height * 1.28
        data.lens = 65
        data.clip_start = .001
        data.clip_end = 100
        cameras.append(obj)
    scene.camera = cameras[0]
    return stage


def prepare_lighting_control(scene, ring, stage):
    ring['light_on'] = 0.0
    ring.id_properties_ui('light_on').update(min=0, max=1, description='0 apagada / 1 acesa. Timeline demonstrates the change.')
    ring['light_control_material'] = 'U200_Diffuser'
    ring['website_emission_strength_on'] = 4.0
    material = next(m for obj in ring.children_recursive if obj.type == 'MESH'
                    for m in obj.data.materials if m and m.name.startswith('U200_Diffuser'))
    ring['light_control_material'] = material.name
    strength = material.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
    curve = strength.driver_add('default_value')
    variable = curve.driver.variables.new()
    variable.name = 'on'
    variable.type = 'SINGLE_PROP'
    variable.targets[0].id = ring
    variable.targets[0].data_path = '["light_on"]'
    curve.driver.expression = '4.0 * on'
    # Render-only soft emitters reproduce light falloff. Exports keep a single
    # named emissive material so the website needn't create four shadow lights.
    center_z = ring.location.z + .11
    for label, x, dz, width, height in [('Top',0,.092,.205,.024),
                                      ('Bottom',0,-.092,.205,.024),
                                      ('Left',-.126,0,.024,.125),
                                      ('Right',.126,0,.024,.125)]:
        obj = light(scene, 'U200 glow '+label, (x,-.017,center_z+dz), 0, width,
                    (1,.89,.72), (x,-1,center_z+dz), size_y=height)
        for col in list(obj.users_collection):
            col.objects.unlink(obj)
        stage.objects.link(obj)
        curve = obj.data.driver_add('energy')
        variable = curve.driver.variables.new()
        variable.name = 'on'
        variable.type = 'SINGLE_PROP'
        variable.targets[0].id = ring
        variable.targets[0].data_path = '["light_on"]'
        curve.driver.expression = '.6 * on'
    scene.frame_start = 1
    scene.frame_end = 120
    scene.render.fps = 30
    for frame, value in [(1,0),(24,0),(36,1),(84,1),(96,0),(120,0)]:
        ring['light_on'] = float(value)
        ring.keyframe_insert(data_path='["light_on"]', frame=frame)
    if ring.animation_data and ring.animation_data.action:
        ring.animation_data.action.name = 'U200 - Acender e apagar'
    for label, frame in [('APAGADA',1),('ACENDER',24),('ACESA',36),('APAGAR',84),('APAGADA ',96)]:
        scene.timeline_markers.new(label, frame=frame)
    scene.frame_set(1)


def evaluated_stats(root):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    vertices = 0
    triangles = 0
    bounds = []
    for obj in root.children_recursive:
        if obj.type not in {'MESH','FONT','CURVE'}:
            continue
        ev = obj.evaluated_get(dg)
        mesh = ev.to_mesh()
        if mesh is None:
            continue
        mesh.calc_loop_triangles()
        vertices += len(mesh.vertices)
        triangles += len(mesh.loop_triangles)
        bounds += [obj.matrix_world @ v.co for v in mesh.vertices]
        ev.to_mesh_clear()
    lo = [min(v[i] for v in bounds) for i in range(3)]
    hi = [max(v[i] for v in bounds) for i in range(3)]
    return {'vertices':vertices,'triangles':triangles,'min':lo,'max':hi,
            'dimensions_native_xyz':[hi[i]-lo[i] for i in range(3)]}


def export_asset(edit_scene, roots, stem, reset_root=False):
    """Join evaluated copies by product and material; keep editable originals."""
    edit_scene.frame_set(1)
    bpy.context.window.scene = edit_scene
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    copies = []
    for root in roots:
        copy_root = bpy.data.objects.new(root.name + '_Export', None)
        for key in root.keys():
            if key != '_RNA_UI':
                copy_root[key] = root[key]
        # Each standalone asset has its native local orientation and origin.
        copy_root.matrix_world = root.matrix_world.copy()
        if reset_root:
            copy_root.matrix_world.identity()
        groups = {}
        for obj in root.children_recursive:
            if obj.type not in {'MESH','FONT','CURVE'}:
                continue
            ev = obj.evaluated_get(dg)
            mesh = bpy.data.meshes.new_from_object(ev, depsgraph=dg)
            clone = bpy.data.objects.new(obj.name, mesh)
            clone.matrix_world = root.matrix_world.inverted() @ obj.matrix_world
            # Builder meshes use one material each; include all slots in the
            # grouping key to preserve any deliberate multi-material object.
            key = tuple(m.name if m else '' for m in mesh.materials)
            groups.setdefault(key, []).append(clone)
        copies.append((copy_root, groups))
    export_scene = create_scene('Export - '+stem)
    for copy_root, groups in copies:
        export_scene.collection.objects.link(copy_root)
        for materials, objects in groups.items():
            for obj in objects:
                export_scene.collection.objects.link(obj)
            bpy.ops.object.select_all(action='DESELECT')
            for obj in objects:
                obj.select_set(True)
            bpy.context.view_layer.objects.active = objects[0]
            if len(objects)>1:
                bpy.ops.object.join()
            joined = bpy.context.view_layer.objects.active
            joined.name = copy_root.name + ' - ' + (materials[0] if materials else 'Geometry')
            # matrix_basis already encodes geometry local to its model root.
            joined.parent = copy_root
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='SELECT')
    path = OUT / (stem+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,
                              export_yup=True,export_animations=False,export_extras=True,
                              export_cameras=False,export_lights=False,export_apply=True)
    size = path.stat().st_size
    calls = sum(len(obj.data.materials) for obj in export_scene.objects if obj.type=='MESH')
    # These are disposable copies created by this function only.
    for obj in list(export_scene.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.context.window.scene = edit_scene
    bpy.data.scenes.remove(export_scene)
    return {'file':str(path),'bytes':size,'material_primitives_estimate':calls}


def build():
    scene = create_scene(SCENE_NAME)
    mt09 = load_builder('recording_mt09.py','build_mt09')(scene)
    ring = load_builder('recording_u200.py','build_u200')(scene)
    phone = load_builder('recording_s25.py','build_s25')(scene)
    ring.location.z = float(mt09['mount_height_m'])
    phone.rotation_euler.y = math.pi/2
    phone.location = (0,0,ring.location.z + float(ring.get('phone_center_z',.11)))
    organize(scene, mt09, '01 - Ulanzi MT09')
    organize(scene, ring, '02 - Ulanzi U200 Ring Bar')
    organize(scene, phone, '03 - Samsung Galaxy S25 Ultra')
    height = ring.location.z + .22
    stage = set_presentation(scene, height)
    prepare_lighting_control(scene, ring, stage)
    bpy.context.view_layer.update()
    report = {'blender':bpy.app.version_string,'scene':scene.name,'units':'meters',
              'source':'Original geometry based on cited research; no downloaded meshes',
              'models':{},'exports':[]}
    for root in [mt09,ring,phone]:
        report['models'][root.name] = evaluated_stats(root)
    for root, stem in [(mt09,'ulanzi-mt09'),(ring,'ulanzi-u200'),(phone,'galaxy-s25-ultra')]:
        report['exports'].append(export_asset(scene,[root],stem,True))
    report['exports'].append(export_asset(scene,[mt09,ring,phone],'imports-tech-recording-kit'))
    scene.frame_set(60)
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    ring.select_set(True)
    bpy.context.view_layer.objects.active = ring
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == 'VIEW_3D':
                area.spaces.active.clip_start = .001
                area.spaces.active.clip_end = 100
                area.spaces.active.region_3d.view_perspective = 'CAMERA'
                area.spaces.active.shading.type = 'MATERIAL'
                area.spaces.active.shading.use_scene_lights = True
                area.spaces.active.shading.use_scene_world = True
                area.spaces.active.overlay.show_overlays = False
    notes = bpy.data.texts.new('READ ME - Recording Kit')
    notes.write('IMPORTS TECH / RECORDING KIT\n\nOriginal editable models: U200, MT09 and Galaxy S25 Ultra.\n'
                'Timeline: frame 1 light OFF; frame 60 light ON; frame 120 OFF.\n'
                'U200 custom property light_on controls diffuser emission and render-only lamps.\n'
                'Phone Silverblue, no case: adjustable working choice.\n'
                'U200 outer 290 x 220 x 31 mm is provisional; sources disagree on width.\n'
                'MT09 feet and adapter details are visual estimates, not manufacturing CAD.\n'
                'All product objects are editable and grouped in three collections.\n'
                'Presentation lights/cameras/floor are excluded from the GLB exports.\n'
                'GLB materials use stable S25_, MT09_, U200_ names. GLBs are exported light OFF.\n'
                'No website integration or deployment performed in this step.\n')
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'imports-tech-recording-kit.blend'),compress=True)
    (OUT/'build-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    return report


if __name__ in {'__main__','builtins'} or globals().get('RUN_RECORDING_BUILD'):
    result = build()
