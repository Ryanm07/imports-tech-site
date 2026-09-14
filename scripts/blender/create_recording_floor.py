"""Build the taller studio rendition in the open Blender, retaining prior scenes.

The native U200 and S25 exports are copied unchanged to public/models. Only the
new support is exported here. The presentation remains a separate .blend file.
"""
import json
import math
import shutil
from pathlib import Path

import bpy


def export_stand(helpers, scene, root, path):
    """Bake each mesh into root coordinates before grouping, for tight bounds."""
    bpy.context.window.scene = scene
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    groups = {}
    for obj in root.children_recursive:
        if obj.type != 'MESH':
            continue
        data = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph),depsgraph=depsgraph)
        data.transform(root.matrix_world.inverted() @ obj.matrix_world)
        clone = bpy.data.objects.new(obj.name + '_export',data)
        key = tuple(mat.name for mat in data.materials)
        groups.setdefault(key,[]).append(clone)
    export_scene = helpers['create_scene']('Export - floor stand only')
    export_root = bpy.data.objects.new('RecordingFloorStand_Export',None)
    export_scene.collection.objects.link(export_root)
    for key in root.keys():
        if key != '_RNA_UI':
            export_root[key] = root[key]
    for key, objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            export_scene.collection.objects.link(obj)
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        if len(objects)>1:
            bpy.ops.object.join()
        joined = bpy.context.view_layer.objects.active
        joined.name = 'RecordingFloorStand - '+key[0]
        joined.parent = export_root
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,
                              use_active_scene=True,export_yup=True,export_animations=False,
                              export_extras=True,export_cameras=False,export_lights=False,
                              export_apply=True)
    report = {'file':str(path),'bytes':path.stat().st_size,
              'material_primitives_estimate':len(groups)}
    for obj in list(export_scene.objects):
        bpy.data.objects.remove(obj,do_unlink=True)
    bpy.context.window.scene = scene
    bpy.data.scenes.remove(export_scene)
    return report


def build():
    script_dir = Path(__file__).parent
    helpers = {'__file__':str(script_dir/'create_recording_kit.py'),
               '__name__':'recording_helpers'}
    exec(compile((script_dir/'create_recording_kit.py').read_text(encoding='utf-8-sig'),
                 helpers['__file__'],'exec'),helpers)
    repo = script_dir.parents[1]
    out = repo/'outputs'/'recording-kit'
    public = repo/'public'/'models'
    scene = helpers['create_scene']('Imports Tech - Floor Recording Kit')
    stand = helpers['load_builder']('recording_floor_stand.py','build_floor_stand')(scene)
    ring = helpers['load_builder']('recording_u200.py','build_u200')(scene)
    phone = helpers['load_builder']('recording_s25.py','build_s25')(scene)
    ring.name = 'UlanziU200_Studio'
    phone.name = 'GalaxyS25Ultra_Studio'
    ring.location.z = float(stand['mount_height_m'])
    ring.scale = (1.5,1.5,1.5)
    phone.rotation_euler.y = math.pi/2
    phone.location = (0,0,1.595)
    phone.scale = (1.5,1.5,1.5)
    ring['scene_scale_note'] = '1.5x presentation scale; native standalone GLB remains unchanged.'
    phone['scene_scale_note'] = '1.5x presentation scale; native standalone GLB remains unchanged.'
    helpers['organize'](scene,stand,'01 - Floor stand adaptation')
    helpers['organize'](scene,ring,'02 - U200 scene rendition')
    helpers['organize'](scene,phone,'03 - S25 Ultra scene rendition')
    height = 1.77
    stage = helpers['set_presentation'](scene,height)
    helpers['prepare_lighting_control'](scene,ring,stage)
    # Retarget the original close-up product lights for a full floor stand.
    lamps = {
        'Softbox key':((-1.3,-2.1,2.7),350,2.0),
        'Softbox fill':((1.4,-.6,1.9),180,1.7),
        'Softbox edge':((.2,1.6,2.5),430,1.4),
        'Operator side fill':((-1.2,1.2,1.8),150,1.5),
    }
    for obj in stage.objects:
        name = obj.name.split('.')[0]
        if name in lamps:
            obj.location, obj.data.energy, obj.data.size = lamps[name]
            helpers['look_at'](obj,(0,0,.95))
        elif name.startswith('U200 glow'):
            obj.location.x *= 1.5
            obj.location.y *= 1.5
            obj.location.z = 1.595 + (obj.location.z-1.54)*1.5
            obj.data.size *= 1.5
            obj.data.size_y *= 1.5
        elif obj.type == 'CAMERA':
            if 'Operator' in obj.name:
                obj.location = (-2.5,4.4,2.5)
            elif 'elevation' in obj.name:
                obj.location = (0,-5,.93)
            else:
                obj.location = (2.5,-4.4,2.35)
            helpers['look_at'](obj,(0,0,.94))
            obj.data.ortho_scale = 2.07
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1100
    scene.cycles.samples = 32
    report = {'scene':scene.name,'units':'meters','models':{},
              'note':'Original floor stand adaptation. Ring and phone shown at 1.5x for studio consistency; native GLBs unchanged.'}
    for obj in [stand,ring,phone]:
        report['models'][obj.name] = helpers['evaluated_stats'](obj)
    report['export'] = export_stand(helpers,scene,stand,out/'recording-floor-stand.glb')
    for name in ['recording-floor-stand','ulanzi-u200','galaxy-s25-ultra']:
        shutil.copy2(out/(name+'.glb'),public/(name+'.glb'))
    report['public_assets'] = {name: (public/(name+'.glb')).stat().st_size
                              for name in ['recording-floor-stand','ulanzi-u200','galaxy-s25-ultra']}
    scene.frame_set(60)
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    stand.select_set(True)
    bpy.context.view_layer.objects.active = stand
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == 'VIEW_3D':
                area.spaces.active.clip_start = .01
                area.spaces.active.clip_end = 100
                area.spaces.active.region_3d.view_perspective = 'CAMERA'
                area.spaces.active.overlay.show_overlays = False
    note = bpy.data.texts.new('READ ME - Floor rendition')
    note.write('IMPORTS TECH / FLOOR RECORDING KIT\n\n'
               'Original floor stand adaptation: mounting plane 1.43m, ground 0m.\n'
               'Not the published dimensions of the compact MT09.\n'
               'Ring and phone 1.5x presentation scale, assembled height ~1.77m.\n'
               'Native U200/S25 public GLBs retain original scale and orientation.\n'
               'Prior compact recording kit and prior scenes are retained.\n'
               'Timeline: frame 1 OFF, frame 60 ON, frame 120 OFF.\n'
               'Presentation lights/cameras/floor excluded from standalone export.\n')
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'imports-tech-recording-kit-floor.blend'),compress=True)
    (out/'floor-build-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    scene.render.filepath = str(out/'floor-preview.png')
    bpy.ops.render.render(write_still=True)
    return report


if __name__ in {'__main__','builtins'}:
    result = build()
